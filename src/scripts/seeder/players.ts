import * as crypto from "crypto";
import { Player } from "../../types";
import { generate } from "random-words";
import { hashPassword } from "../../core/auth";

/**
 * Generate an array of test players with randomised attributes.
 *
 * Each player has:
 * - A unique UUID as their playerId
 * - A friendly random username (two English words joined by '-')
 * - A pseudo-random email for testing login/signup flows
 * - A random number of total scans (0–2000), for gameplay stat diversity
 * - A creation timestamp for sorting/filter tests
 *
 * @param count - How many players to generate (default: 45)
 * @returns Player[] array with fully-formed random test users
 *
 * Usage: Call in seeding scripts to quickly populate your Players table and enable
 * robust dev/test UIs, game logic, or social features.
 */
export function generatePlayers(count: number): Player[] {
  const players: Player[] = [];

  players.push({
    playerId: crypto.randomUUID(),
    username: "test",
    email: "test@test.com",
    passwordHash: hashPassword("test"),
    totalScans: 666,
    createdAt: new Date().toISOString(),
  });

  for (let i = 0; i < count; i++) {
    players.push({
      // Universally unique identifier for DB primary key
      playerId: crypto.randomUUID(),
      // Username is two random English words joined for memorability
      username: generate({ exactly: 2, join: "-" }),
      // Email is two random words joined with '@', domain '.com'; prevents real emails in test
      email: `${generate({ exactly: 2, join: "@" })}.com`,
      // Simulated scan/gameplay stat between 0 and 2000 inclusive
      totalScans: Math.floor(Math.random() * 2001),
      // Realistic ISO creation date (current timestamp)
      createdAt: new Date().toISOString(),
    });
  }
  return players;
}
