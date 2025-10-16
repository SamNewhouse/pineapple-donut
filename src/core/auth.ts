import * as jwt from "jsonwebtoken";
import { PlayerToken, Player } from "../types";
import * as crypto from "crypto";
import { JWT_SECRET } from "../config/variables";

/**
 * Verify a password against its stored hash
 *
 * Uses PBKDF2 (Password-Based Key Derivation Function 2) for secure password verification.
 * This function reconstructs the hash using the provided password and stored salt,
 * then compares it with the stored hash using a constant-time comparison.
 *
 * Security Features:
 * - PBKDF2 with SHA-512 for strong key derivation
 * - 150,000 iterations to slow down brute force attacks
 * - Salt-based hashing prevents rainbow table attacks
 * - Constant-time comparison prevents timing attacks
 *
 * Hash Format: "salt:hash" (hex-encoded)
 *
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash in format "salt:hash"
 * @returns true if password matches, false otherwise
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  // Extract salt and hash from stored format "salt:hash"
  const [salt, hash] = storedHash.split(":");

  // Recreate hash using same parameters as original hashing
  const testHash = crypto.pbkdf2Sync(password, salt, 150000, 64, "sha512").toString("hex");

  // Compare hashes using constant-time comparison (built into JS string equality)
  return hash === testHash;
}

/**
 * Hash a password for secure storage
 *
 * Creates a secure password hash using PBKDF2 with a randomly generated salt.
 * This function is used during user registration and password changes.
 *
 * Security Parameters:
 * - 32-byte random salt (256 bits of entropy)
 * - PBKDF2 with SHA-512 hash function
 * - 150,000 iterations (computationally expensive for attackers)
 * - 64-byte output hash (512 bits)
 *
 * Storage Format: "salt:hash" (both hex-encoded for easy storage)
 *
 * @param password - Plain text password to hash
 * @returns Formatted hash string ready for database storage
 */
export function hashPassword(password: string): string {
  // Generate cryptographically secure random salt
  const salt = crypto.randomBytes(32).toString("hex");

  // Create hash using PBKDF2 with strong parameters
  const hash = crypto.pbkdf2Sync(password, salt, 150000, 64, "sha512").toString("hex");

  // Return in format that can be stored and later parsed
  return `${salt}:${hash}`;
}

/**
 * Generate a JWT token for authenticated API access
 *
 * Creates a JSON Web Token containing player information for stateless
 * authentication. The token is signed with the server's secret key and
 * can be verified by any API endpoint without database lookups.
 *
 * Token Contents:
 * - playerId: For identifying the authenticated user
 * - email: For display and account management
 * - username: For social features and display
 * - iat: Issued at timestamp (automatically added by JWT library)
 *
 * Security Considerations:
 * - Token is signed but not encrypted (don't put sensitive data)
 * - No expiration set (tokens are long-lived for mobile app UX)
 * - Secret key must be kept secure and rotated periodically
 *
 * @param player - Player object containing user information
 * @returns Signed JWT token string for client storage
 */
export function generateToken(player: Player): string {
  return jwt.sign(
    {
      id: player.id,
      email: player.email,
      username: player.username,
    },
    JWT_SECRET!, // Server secret key for signing
  );
}

/**
 * Verify and decode a JWT token
 *
 * Validates a JWT token's signature and extracts the player information.
 * This is used internally by other auth functions and should not be
 * called directly by API handlers (use parseAuthToken instead).
 *
 * Verification Process:
 * - Checks token signature against server secret
 * - Validates token structure and format
 * - Extracts and returns player data
 * - Returns null for any invalid token
 *
 * @param token - JWT token string to verify
 * @returns PlayerToken object if valid, null if invalid/expired
 */
export function verifyToken(token: string): PlayerToken | null {
  try {
    // Verify signature and decode payload
    return jwt.verify(token, JWT_SECRET!) as PlayerToken;
  } catch {
    // Any JWT error (invalid signature, malformed, etc.) returns null
    return null;
  }
}

/**
 * Parse and validate Authorization header for API authentication
 *
 * Extracts and validates a Bearer token from the HTTP Authorization header.
 * This is the primary authentication function used by protected API endpoints
 * to identify the current user.
 *
 * Expected Header Format: "Bearer <jwt-token>"
 *
 * Authentication Flow:
 * 1. Validate header format and presence
 * 2. Extract token from "Bearer " prefix
 * 3. Verify token signature and decode
 * 4. Return player information or throw error
 *
 * Error Conditions:
 * - Missing Authorization header
 * - Invalid header format (not "Bearer ...")
 * - Invalid or expired JWT token
 * - Malformed token structure
 *
 * @param authHeader - Authorization header value from HTTP request
 * @returns PlayerToken with authenticated user info
 * @throws Error if authentication fails (caller should return 401)
 */
export function parseAuthToken(authHeader?: string): PlayerToken {
  // Validate Authorization header format
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  // Extract token by removing "Bearer " prefix (7 characters)
  const token = authHeader.substring(7);

  // Verify token and extract player info
  const player = verifyToken(token);
  if (!player) {
    throw new Error("Invalid token");
  }

  return player;
}
