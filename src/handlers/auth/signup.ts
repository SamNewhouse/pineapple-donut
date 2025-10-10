import { APIGatewayProxyHandler } from "aws-lambda";
import * as crypto from "crypto";
import { parseBody, badRequest, conflict, success, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables } from "../../types";
import { hashPassword } from "../../core/auth";

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
    const passwordHash = hashPassword(password);

    await Dynamodb.put(Tables.Players, {
      playerId,
      email,
      passwordHash,
      username: email.split("@")[0],
      score: 0,
      totalScans: 0,
      createdAt: new Date().toISOString(),
    });

    return success(
      {
        playerId,
        email,
        username: email.split("@")[0],
      },
      201,
      "Account created successfully",
    );
  } catch (error) {
    return handleError(error);
  }
};
