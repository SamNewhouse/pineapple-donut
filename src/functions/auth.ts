import * as jwt from "jsonwebtoken";
import { PlayerToken, Player, Tables } from "../types";
import * as crypto from "crypto";
import { JWT_SECRET } from "../config/variables";
import * as Dynamodb from "../lib/dynamodb";
import { faker } from "@faker-js/faker";
import { generateWord } from "../utils/helpers";

/**
 * Hash a password for secure storage using PBKDF2.
 *
 * @param password - Plain text password to hash
 * @returns        - Formatted hash string "salt:hash" (both hex)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 150000, 64, "sha512");
  return `${salt}:${hash.toString("hex")}`;
}

/**
 * Securely verify a password against a stored PBKDF2 hash.
 * Uses timing-safe comparison for defense against timing attacks.
 *
 * @param password    - Plain text password to verify
 * @param storedHash  - Stored hash, format "salt:hash"
 * @returns           - true if the password matches, false otherwise
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 150000, 64, "sha512");
  const hashBuf = Buffer.from(hash, "hex");
  try {
    return hashBuf.length === testHash.length && crypto.timingSafeEqual(hashBuf, testHash);
  } catch {
    return false;
  }
}

/**
 * Remove sensitive fields from Player before returning to client.
 *
 * @param player - Player object (from DB)
 * @returns      - Player fields safe for client exposure
 */
export function sanitizePlayer(player: Player): Omit<Player, "passwordHash" | "token"> {
  const { passwordHash, ...publicFields } = player;
  return publicFields;
}

/**
 * Generate a JWT token for authenticated API access.
 * Always includes an expiration for security.
 *
 * @param player - Player object (user info)
 * @returns      - Signed JWT token string
 */
export function generateToken(player: Player): string {
  return jwt.sign(
    {
      playerId: player.id,
      email: player.email,
    },
    JWT_SECRET!,
    { expiresIn: "90d" },
  );
}

/**
 * Verify and decode a JWT token's payload.
 *
 * @param token - JWT token string
 * @returns     - PlayerToken object if valid; null otherwise
 */
export function verifyToken(token: string): PlayerToken | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as PlayerToken;
  } catch {
    return null;
  }
}

/**
 * Parse and verify a Bearer Authorization header for API authentication.
 *
 * @param authHeader - HTTP Authorization header ("Bearer <jwt>")
 * @returns          - PlayerToken for authenticated user
 * @throws           - Error if header missing or token invalid/expired
 */
export function parseAuthToken(authHeader?: string): PlayerToken {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.substring(7);
  const player = verifyToken(token);
  if (!player) {
    throw new Error("Invalid token");
  }
  return player;
}

/**
 * Register a new player account.
 *
 * - Enforces unique email
 * - Generates a friendly username (word-word-number)
 * - Hashes password before storage
 * - Returns JWT token for immediate login
 * - NEVER returns the password hash
 *
 * @param email    - User's email (must be unique)
 * @param password - Password (plain text)
 * @returns        - { player: Omit<Player, "passwordHash">, token }
 * @throws         - Error if email exists or params missing
 */
export async function registerPlayer(
  email: string,
  password: string,
): Promise<{ player: Omit<Player, "passwordHash">; token: string }> {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const existingPlayers = await Dynamodb.query(
    Tables.Players,
    "email = :email",
    { ":email": email },
    "EmailIndex",
  );
  if (existingPlayers.length > 0) {
    throw new Error("User already exists");
  }

  const number = Math.floor(Math.random() * 2001);
  const id = crypto.randomUUID();
  const username = `${generateWord(3, 7)}-${generateWord(3, 7)}-${number}`;
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();

  const player: Player = {
    id,
    email,
    username,
    totalScans: 0,
    createdAt,
    passwordHash,
  };

  await Dynamodb.put(Tables.Players, player);
  const token = generateToken(player);

  return { player: sanitizePlayer(player), token };
}

/**
 * Authenticate a player by email and password, returning public fields and a JWT token.
 *
 * Throws error on failed authentication for safe error handling in API or services.
 *
 * @param email    - Player's email (must exist in database)
 * @param password - Plaintext password to verify
 * @returns        - { player: Omit<Player, "passwordHash" | "token">, token: string }
 * @throws         - Error("Invalid credentials") for failed login attempts
 */
export async function loginPlayer(
  email: string,
  password: string,
): Promise<{ player: Omit<Player, "passwordHash">; token: string }> {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const players: Player[] = await Dynamodb.query(
    Tables.Players,
    "email = :email",
    { ":email": email },
    "EmailIndex",
  );

  if (
    players.length === 0 ||
    !players[0].passwordHash ||
    !verifyPassword(password, players[0].passwordHash)
  ) {
    throw new Error("Invalid credentials");
  }

  const player = players[0];
  const token = generateToken(player);

  return {
    player: sanitizePlayer(player),
    token,
  };
}
