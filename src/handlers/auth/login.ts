import { APIGatewayProxyHandler } from "aws-lambda";
import * as Dynamodb from "../../core/dynamodb";
import { Tables } from "../../types";
import { badRequest, handleError, parseBody, success, unauthorized } from "../../core/http";
import { generateToken, verifyPassword } from "../../core/auth";

export const login: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password } = parseBody(event.body);

    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    const players = await Dynamodb.query(
      Tables.Players,
      "email = :email",
      { ":email": email },
      "EmailIndex",
    );

    if (players.length === 0) {
      return unauthorized("Invalid credentials");
    }

    const player = players[0];

    if (!player.passwordHash || !verifyPassword(password, player.passwordHash)) {
      return unauthorized("Invalid credentials");
    }

    return success(
      {
        playerId: player.playerId,
        email: player.email,
        username: player.username,
        token: generateToken(player),
      },
      200,
      "Login successful",
    );
  } catch (error) {
    return handleError(error);
  }
};
