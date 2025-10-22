import * as crypto from "crypto";
import { Player } from "../../types";
import { generateWord } from "../../utils/helpers";

function fakeHashPassword(password: string): string {
  return "dev-salt:" + Buffer.from(password).toString("hex");
}

/**
 * Generate an array of test players with randomised attributes.
 *
 * Each player has:
 * - A unique UUID as their id
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
  const number = Math.floor(Math.random() * 2001);

  players.push({
    id: crypto.randomUUID(),
    username: "test",
    email: "test@test.com",
    passwordHash: fakeHashPassword("test"),
    totalScans: 666,
    createdAt: new Date().toISOString(),
  });

  for (let i = 0; i < count; i++) {
    players.push({
      id: crypto.randomUUID(),
      username: `${generateWord(3, 7)}-${generateWord(3, 7)}-${number}`,
      email: `${generateWord(8, 15)}@${generateWord(6, 10)}.${generateWord(2, 3)}`,
      totalScans: Math.floor(Math.random() * 2001),
      createdAt: new Date().toISOString(),
      passwordHash: fakeHashPassword(crypto.randomUUID()),
    });
  }
  return players;
}
