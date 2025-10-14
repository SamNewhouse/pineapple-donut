import * as jwt from "jsonwebtoken";
import { UserToken } from "../types";
import * as crypto from "crypto";

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 150000, 64, "sha512").toString("hex");
  return hash === testHash;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 150000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function generateToken(player: any): string {
  return jwt.sign(
    {
      playerId: player.playerId,
      email: player.email,
      username: player.username,
    },
    process.env.JWT_SECRET!,
  );
}

export function verifyToken(token: string): UserToken | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UserToken;
  } catch {
    return null;
  }
}

export function parseAuthToken(authHeader?: string): UserToken {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (!user) {
    throw new Error("Invalid token");
  }
  return user;
}
