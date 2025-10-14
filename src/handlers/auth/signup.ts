import { APIGatewayProxyHandler } from "aws-lambda";
import * as crypto from "crypto";
import { parseBody, badRequest, conflict, success, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Player } from "../../types"; // Import Player type
import { hashPassword, generateToken } from "../../core/auth";

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

    const playerId = crypto.randomUUID();
    const username = email.split("@")[0];
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    const player: Player = {
      playerId,
      email,
      username,
      score: 0,
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
