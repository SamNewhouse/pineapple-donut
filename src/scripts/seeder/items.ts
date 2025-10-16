import * as crypto from "crypto";
import { Item, Player, Collectable } from "../../types";

/**
 * Generate an array of item instances, simulating players "finding" or "scanning" items.
 *
 * Each item instance links:
 * - a player (by random assignment)
 * - a catalog item (from the generated catalog–randomly chosen)
 * - a realistic foundAt timestamp (within the last week)
 *
 * This function is used to create test data representing players' collections/inventories.
 *
 * @param players      - String of Player objects to randomly assign items to
 * @param itemCatalogs - String of ItemCatalog objects to reference as the item basis
 * @param count        - Number of item instances to generate (default: 500)
 * @returns Item[]     - Array of Item instances (each row = a scan/found record)
 *
 * Example usage: Populating your Items table for development, admin tools, and UI testing.
 */
export function generateItems(
  players: Player[],
  ItemCatalog: Collectable[],
  count: number,
): Item[] {
  if (ItemCatalog.length === 0) return [];
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    // Randomly select a catalog item and a player to "own" the item
    const randomCollectable = ItemCatalog[Math.floor(Math.random() * ItemCatalog.length)];
    const randomPlayer = players[Math.floor(Math.random() * players.length)].id;
    // Simulate a found/discovery time within the past week
    const foundAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    items.push({
      // Unique identifier for this instance (scan/found record)
      id: crypto.randomUUID(),
      // Reference to catalog/base item
      collectableId: randomCollectable.id,
      // Owner (player who "found" the item)
      playerId: randomPlayer,
      // Discovery timestamp (ISO format)
      foundAt,
    });
  }
  return items;
}
