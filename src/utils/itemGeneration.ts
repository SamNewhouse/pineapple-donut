import * as crypto from "crypto";
import { Collectable, Item, Player, Rarity } from "../types";

/**
 * Exponentially roll item quality (1-100, high values are rare).
 */
function rollQuality(): number {
  const x = Math.random();
  const expFactor = 7;
  const quality = Math.floor(100 * Math.pow(x, 1 / expFactor)) + 1;
  return Math.min(quality, 100);
}

function rollCollectable(collectables: Collectable[], rarities: Rarity[]): Collectable {
  if (collectables.length === 0) throw new Error("No collectables provided");

  // Assign weights to collectables based on their rarity's minChance/maxChance (rarer = lower weight)
  const weights = collectables.map((collectable) => {
    const rarity = rarities.find((r) => r.id === collectable.rarity);
    // Use minChance (or avg of min/max) as a proxy for difficulty—lower minChance = harder
    const difficultyScore = rarity ? (rarity.minChance + rarity.maxChance) / 2 : 1;
    return difficultyScore;
  });

  // Normalize weights
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normalized = weights.map((w) => w / totalWeight);

  // Pick collectable by weighted random
  let r = Math.random();
  for (let i = 0; i < collectables.length; i++) {
    r -= normalized[i];
    if (r <= 0) {
      return collectables[i];
    }
  }
  return collectables[collectables.length - 1]; // fallback, should never reach
}

/**
 * Generate a single Item instance using player, collectable, and rarity config.
 * Keeps item creation logic consistent for backend & batch gen.
 */
export function generateItem(
  player: Player,
  collectables: Collectable[],
  rarities: Rarity[],
  foundAt?: string,
): Item {
  const collectable = rollCollectable(collectables, rarities);

  const rarity = rarities.find((r) => r.id === collectable.rarity);
  if (!rarity) throw new Error("Rarity not found for collectable");

  const quality = rollQuality();
  const chance = rarity.minChance + (rarity.maxChance - rarity.minChance) * (quality / 100);

  return {
    id: crypto.randomUUID(),
    collectableId: collectable.id,
    playerId: player.id,
    foundAt: foundAt || new Date().toISOString(),
    quality,
    chance: parseFloat(chance.toFixed(12)),
  };
}

/**
 * Bulk generate items for testing/admin/dev.
 */
export function generateItems(
  players: Player[],
  collectables: Collectable[],
  rarities: Rarity[],
  count: number,
): Item[] {
  if (collectables.length === 0) return [];
  const items: Item[] = [];

  for (let i = 0; i < count; i++) {
    const player = players[Math.floor(Math.random() * players.length)];
    const foundAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    // Pass arrays, not individual collectable/rarity!
    items.push(generateItem(player, collectables, rarities, foundAt));
  }
  return items;
}
