import { APIGatewayProxyHandler } from "aws-lambda";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Player } from "../../types";
import { badRequest, handleError, parseBody, success, unauthorized } from "../../core/http";
import { generateToken, verifyPassword } from "../../core/auth";

/**
 * Authenticate a player and generate access token
 *
 * Handles player login by validating credentials and returning a JWT token
 * for authenticated API access. This is the primary authentication endpoint
 * used by the mobile app after initial registration.
 *
 * Security Features:
 * - Email-based authentication (emails are unique in the system)
 * - Secure password verification using bcrypt/similar hashing
 * - Generic error messages to prevent user enumeration attacks
 * - JWT token generation for stateless authentication
 * - No session storage required (JWT contains all needed info)
 *
 * Authentication Flow:
 * 1. Client submits email/password credentials
 * 2. System looks up player by email using GSI
 * 3. Password is verified against stored hash
 * 4. JWT token is generated with player information
 * 5. Token is returned to client for future API calls
 *
 * @param event - API Gateway event with email and password in request body
 * @returns Player data with JWT token or authentication error
 *
 * Error Handling:
 * - Returns generic "Invalid credentials" for both non-existent users
 *   and wrong passwords to prevent account enumeration
 * - Missing fields return specific validation errors
 * - Database/system errors are handled generically
 */
export const login: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse login credentials from request body
    const { email, password }: { email: string; password: string } = parseBody(event.body);

    // Validate required fields
    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    // Look up player by email using EmailIndex GSI
    // This allows efficient email-based authentication queries
    const players: Player[] = await Dynamodb.query(
      Tables.Players,
      "email = :email",
      { ":email": email },
      "EmailIndex",
    );

    // Check if account exists
    // Use generic error message to prevent account enumeration attacks
    if (players.length === 0) {
      return unauthorized("Invalid credentials");
    }

    // Get the player record (should only be one due to unique email constraint)
    const player: Player = players[0];

    // Verify password against stored hash
    // Also check that passwordHash exists (defensive programming)
    if (!player.passwordHash || !verifyPassword(password, player.passwordHash)) {
      return unauthorized("Invalid credentials");
    }

    // Authentication successful - generate JWT token
    // Token contains player info for subsequent API calls
    return success(
      {
        playerId: player.playerId,
        email: player.email,
        username: player.username,
        token: generateToken(player), // JWT for authenticated API access
      },
      200,
      "Login successful",
    );
  } catch (error) {
    return handleError(error);
  }
};
