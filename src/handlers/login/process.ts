import { APIGatewayProxyHandler } from "aws-lambda";
import { badRequest, handleError, parseBody, success, unauthorized } from "../../lib/http";
import { loginPlayer } from "../../functions/auth";

/**
 * Authenticate a player and generate access token.
 *
 * Verifies credentials and returns a JWT token for authenticated API access.
 * - Secure password verification (PBKDF2, timing-safe)
 * - Generic error messages (no user enumeration)
 * - Only public player info plus token returned
 *
 * @param event - API Gateway event with email and password in JSON body
 * @returns     - Player public data + JWT token, or authentication error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password } = parseBody(event.body);

    const { player, token } = await loginPlayer(email, password);

    return success({ ...player, token }, 200, "Login successful");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid credentials") {
        return unauthorized("Invalid credentials");
      }
      if (error.message === "Email and password are required") {
        return badRequest(error.message);
      }
      return handleError(error);
    }
    return handleError(new Error(String(error)));
  }
};
