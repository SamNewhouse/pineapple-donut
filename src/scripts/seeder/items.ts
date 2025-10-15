import * as crypto from "crypto";
import { Item, Player, CatalogItem } from "../../types";

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
 * @param players      - Array of Player objects to randomly assign items to
 * @param catalogItems - Array of CatalogItem objects to reference as the item basis
 * @param count        - Number of item instances to generate (default: 500)
 * @returns Item[]     - Array of Item instances (each row = a scan/found record)
 *
 * Example usage: Populating your Items table for development, admin tools, and UI testing.
 */
export function generateItems(
  players: Player[],
  catalogItems: CatalogItem[],
  count: number,
): Item[] {
  if (catalogItems.length === 0) return [];
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    // Randomly select a catalog item and a player to "own" the item
    const randomCatalogItem = catalogItems[Math.floor(Math.random() * catalogItems.length)];
    const randomPlayer = players[Math.floor(Math.random() * players.length)].playerId;
    // Simulate a found/discovery time within the past week
    const foundAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    items.push({
      // Unique identifier for this instance (scan/found record)
      itemId: crypto.randomUUID(),
      // Reference to catalog/base item
      catalogItemId: randomCatalogItem.itemId,
      // Owner (player who "found" the item)
      playerId: randomPlayer,
      // Discovery timestamp (ISO format)
      foundAt,
    });
  }
  return items;
}
