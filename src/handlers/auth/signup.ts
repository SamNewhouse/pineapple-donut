import { APIGatewayProxyHandler } from "aws-lambda";
import * as crypto from "crypto";
import { parseBody, badRequest, conflict, success, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Player } from "../../types";
import { hashPassword, generateToken } from "../../core/auth";
import { generate } from "random-words";

/**
 * Create a new player account
 *
 * Handles user registration for the game. Creates a new player with:
 * - Unique email validation
 * - Secure password hashing
 * - Auto-generated username (format: word-word-number)
 * - JWT token for immediate login
 * - Initial game state (0 total scans)
 *
 * Username Generation:
 * - Uses 2 random words joined by hyphens
 * - Appends a random number (3-6 digits)
 * - Example: "happy-mountain-42" or "blue-river-1337"
 * - This provides friendly, memorable usernames without user input
 *
 * Security Features:
 * - Email uniqueness validation via GSI query
 * - Password hashing before storage
 * - Immediate JWT token generation for seamless UX
 * - Sensitive data (passwordHash) excluded from response
 *
 * @param event - API Gateway event with email and password in request body
 * @returns Created player object with auth token, or error response
 *
 * Flow:
 * 1. Parse and validate email/password
 * 2. Check for existing account with same email
 * 3. Generate unique username and hash password
 * 4. Create player record in database
 * 5. Generate JWT token for immediate authentication
 * 6. Return player data with token for client storage
 */
export const signup: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse registration credentials from request body
    const { email, password } = parseBody(event.body);

    // Validate required fields
    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    // Check if email is already registered
    // Uses EmailIndex GSI for efficient email-based queries
    const existingPlayers = await Dynamodb.query(
      Tables.Players,
      "email = :email",
      { ":email": email },
      "EmailIndex",
    );

    // Prevent duplicate accounts
    if (existingPlayers.length > 0) {
      return conflict("User already exists");
    }

    // Generate a fun, memorable username automatically
    // Format: "word-word" + number (e.g., "happy-mountain-42")
    const word = generate({ exactly: 2, join: "-" });
    const number = Math.floor(Math.random() * 2001);

    // Create unique identifiers and secure password
    const id = crypto.randomUUID();
    const username = `${word}${number}`;
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    // Create player object for public API responses
    // Excludes sensitive fields like passwordHash
    const player: Player = {
      id,
      email,
      username,
      totalScans: 0, // Initialize with no scans completed
      createdAt,
    };

    // Store player in database with hashed password
    // passwordHash is stored but not included in the Player interface
    await Dynamodb.put(Tables.Players, {
      ...player,
      passwordHash, // Store securely hashed password
    });

    // Generate JWT token for immediate authentication
    // This allows the user to start playing without additional login
    const token = generateToken(player);

    // Return success with player data and auth token
    // Client can store token and use it for authenticated requests
    return success(
      {
        ...player,
        token, // Include token for immediate authentication
      },
      201,
      "Account created successfully",
    );
  } catch (error) {
    return handleError(error);
  }
};
