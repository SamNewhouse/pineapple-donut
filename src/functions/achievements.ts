import * as Dynamodb from "../lib/dynamodb";
import { Tables, Achievement } from "../types";

/**
 * Get all Achievements from the DB.
 *
 * @returns Array of Achievements items
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  return Dynamodb.scan(Tables.Achievements);
}

/**
 * Retrieves all items belonging to a specific player.
 *
 * @param playerId - The player's unique ID
 * @returns        - Array of Item objects owned by the player
 *
 * @example
 *   const items = await getItemsByPlayer("player-uuid-123");
 *   // ...display inventory, etc.
 */
export async function getAchievementsByPlayer(ids: string[]): Promise<Achievement[]> {
  return Dynamodb.getBatch(Tables.Achievements, ids);
}
