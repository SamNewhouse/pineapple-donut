import { APIGatewayProxyHandler } from "aws-lambda";
import * as crypto from "crypto";
import { parseBody, badRequest, conflict, success, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Player } from "../../types";
import { hashPassword, generateToken } from "../../core/auth";
import { count, generate } from "random-words";

export const signup: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password } = parseBody(event.body);

    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    const existingPlayers = await Dynamodb.query(
      Tables.Players,
      "email = :email",
      { ":email": email },
      "EmailIndex",
    );

    if (existingPlayers.length > 0) {
      return conflict("User already exists");
    }

    const word = generate({ exactly: 2, join: "-" });
    const number = count({ minLength: 3, maxLength: 6 });

    const playerId = crypto.randomUUID();
    const username = `${word}${number}`;
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    const player: Player = {
      playerId,
      email,
      username,
      totalScans: 0,
      createdAt,
    };

    await Dynamodb.put(Tables.Players, {
      ...player,
      passwordHash,
    });

    // Generate JWT token for autologin
    const token = generateToken({ playerId, email, username });

    return success(
      {
        ...player,
        token,
      },
      201,
      "Account created successfully",
    );
  } catch (error) {
    return handleError(error);
  }
};
