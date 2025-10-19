import * as crypto from "crypto";
import { Item, Player, Collectable, Rarity } from "../../types";

/**
 * Generate an array of item instances, simulating players "finding" or "scanning" items.
 *
 * Each item instance links:
 * - a player (by random assignment)
 * - a catalog item (from the generated catalog–randomly chosen)
 * - a realistic foundAt timestamp (within the last week)
 * - an accurate session chance (from the rarity config tied via Collectable)
 *
 * @param players      - Array of Player objects to randomly assign items to
 * @param collectables - Array of Collectable objects to reference as the item basis
 * @param rarities     - Array of Rarity objects to lookup min/max chance by id
 * @param count        - Number of item instances to generate (default: 500)
 * @returns Item[]     - Array of Item instances (each row = a scan/found record)
 *
 * Example usage: Populating your Items table for development, admin tools, and UI testing.
 */
export function generateItems(
  players: Player[],
  collectables: Collectable[],
  rarities: Rarity[],
  count: number,
): Item[] {
  if (collectables.length === 0) return [];

  const rarityMap = new Map(rarities.map((r) => [r.id, r]));
  const items: Item[] = [];

  for (let i = 0; i < count; i++) {
    const randomCollectable = collectables[Math.floor(Math.random() * collectables.length)];
    const randomPlayer = players[Math.floor(Math.random() * players.length)].id;
    const rarityConfig = rarityMap.get(randomCollectable.rarity);
    let chance = 0;
    if (rarityConfig) {
      chance =
        Math.random() * (rarityConfig.maxChance - rarityConfig.minChance) + rarityConfig.minChance;
    }
    const foundAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    items.push({
      id: crypto.randomUUID(),
      collectableId: randomCollectable.id,
      playerId: randomPlayer,
      foundAt,
      chance: parseFloat(chance.toFixed(8)),
    });
  }
  return items;
}
