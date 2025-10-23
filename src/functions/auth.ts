import * as jwt from "jsonwebtoken";
import { PlayerToken, Player, Tables } from "../types";
import * as crypto from "crypto";
import { JWT_SECRET, STAGE } from "../config/variables";
import * as Dynamodb from "../lib/dynamodb";
import { generateWord } from "../utils/helpers";

type AuthResponse = {
  player: Omit<Player, "passwordHash">;
  token: string;
};

/**
 * Returns scrypt parameters dynamically based on environment.
 *
 * In development mode, the values are intentionally lower to reduce CPU load
 * and speed up local testing. In production, full-strength cryptographic
 * parameters are applied to ensure secure password storage.
 *
 * @returns Object containing scrypt configuration values:
 * - `N`: CPU/memory cost parameter (higher = more secure, slower)
 * - `r`: Block size parameter (affects memory usage)
 * - `p`: Parallelization parameter (affects CPU usage)
 * - `saltBytes`: Random salt size in bytes
 * - `keyLen`: Derived key output length in bytes
 *
 * Memory usage formula: ~128 * N * r * p bytes
 *
 * Security recommendations (OWASP/RFC 7914):
 * - N ≥ 2^14 (16384) for production
 * - salt ≥ 16 bytes (128 bits)
 * - keyLen ≥ 32 bytes (256 bits)
 */
function getScryptParams() {
  const isDev = STAGE === "dev";

  return isDev
    ? { N: 1024, r: 4, p: 1, saltBytes: 4, keyLen: 8 } // Minimal for fast local testing
    : { N: 16384, r: 8, p: 2, saltBytes: 16, keyLen: 64 }; // Production-grade security
}

/**
 * Derive a secure password hash using the scrypt key derivation function.
 *
 * This function generates a memory-hard hash that resists brute-force and GPU attacks.
 * Environment-specific cost parameters are applied automatically, and all configuration
 * is embedded in the returned string for future verification independence.
 *
 * @param password - Plain text password to securely hash
 * @returns Colon-separated string containing all hash components:
 *          "N:r:p:keyLen:salt:derivedKey"
 *
 * Example output formats:
 * - Dev:  "1024:4:1:8:a1b2c3d4:1f2e3d4c5b6a..."
 * - Prod: "16384:8:2:64:9f8e7d6c5b4a3210:8c7b6a5d4e3f2a1b..."
 *
 * The format ensures cross-environment compatibility - hashes generated in any
 * environment can be verified in any other environment.
 */
export function hashPassword(password: string): string {
  const params = getScryptParams();
  const salt = crypto.randomBytes(params.saltBytes).toString("hex");
  const hash = crypto.scryptSync(password, salt, params.keyLen, params);
  return `${params.N}:${params.r}:${params.p}:${params.keyLen}:${salt}:${hash.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored scrypt hash string.
 *
 * Parses the colon-separated hash format to extract original parameters,
 * re-derives the key using the same configuration, and performs a constant-time
 * comparison to prevent timing attacks.
 *
 * @param password - Plain text password to verify
 * @param stored - Colon-separated hash string: "N:r:p:keyLen:salt:derivedKey"
 * @returns true if password matches the stored hash, false otherwise
 *
 * Security features:
 * - Uses crypto.timingSafeEqual() for timing-attack-resistant comparison
 * - Automatically adapts to any stored parameter configuration
 * - Works with hashes generated in any environment (dev/prod)
 * - Salt and parameters are public; only the derived key is secret
 *
 * Example usage:
 *   const isValid = verifyPassword("userPassword123", storedHashFromDB);
 */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  const N = Number(parts[0]);
  const r = Number(parts[1]);
  const p = Number(parts[2]);
  const keyLen = Number(parts[3]);
  const salt = parts[4];
  const hashHex = parts[5];

  const testHash = crypto.scryptSync(password, salt, keyLen, { N, r, p });
  return crypto.timingSafeEqual(Buffer.from(hashHex, "hex"), testHash);
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
export async function registerPlayer(email: string, password: string): Promise<AuthResponse> {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalisedEmail = email.trim().toLowerCase();
  const existingPlayers = await Dynamodb.query(
    Tables.Players,
    "email = :email",
    { ":email": normalisedEmail },
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
    email: normalisedEmail,
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
export async function loginPlayer(email: string, password: string): Promise<AuthResponse> {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalisedEmail = email.trim().toLowerCase();
  const players: Player[] = await Dynamodb.query(
    Tables.Players,
    "email = :email",
    { ":email": normalisedEmail },
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
