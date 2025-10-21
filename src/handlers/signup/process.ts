import { APIGatewayProxyHandler } from "aws-lambda";
import { parseBody, badRequest, conflict, success, handleError } from "../../lib/http";
import { registerPlayer } from "../../functions/auth";

/**
 * Register a new player account.
 *
 * Handles game user signup, including:
 * - Unique email enforcement and validation
 * - Secure password hashing (PBKDF2 + random salt)
 * - Automatic, friendly username generation (word-word-number)
 * - JWT token issued for instant login
 * - Player record initialized with 0 total scans
 *
 * Username format: "word-word-number" (e.g., "happy-mountain-42")
 *
 * Returns to client:
 * - Public profile fields: id, email, username, totalScans, createdAt
 * - Omitted fields: password hash, secrets
 * - JWT token for authentication header storage
 *
 * @param event - API Gateway event with email and password in body (JSON)
 * @returns     - Success response with player info + auth token, or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password } = parseBody(event.body);

    const { player, token } = await registerPlayer(email, password);

    return success({ ...player, token }, 201, "Account created successfully");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User already exists") {
        return conflict(error.message);
      }
      if (error.message === "Email and password are required") {
        return badRequest(error.message);
      }
      return handleError(error);
    }
    return handleError(new Error(String(error)));
  }
};
