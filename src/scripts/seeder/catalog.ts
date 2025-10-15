import * as crypto from "crypto";
import { CatalogItem } from "../../types";
import { generateItemName } from "../data/words";
import { generateDescription } from "../data/descriptions";
import { rarityTiers } from "../../data/rarity";

/**
 * Pick a session chance for each tier: random between minChance and maxChance.
 * Returns an array used for this generation session/run.
 *
 * Call before catalog generation to establish rarity distribution for the session.
 */
export function assignSessionChances(): Array<{
  name: string;
  color: string;
  chance: number;
}> {
  return rarityTiers.map((tier) => ({
    name: tier.name,
    color: tier.color,
    chance: Math.random() * (tier.maxChance - tier.minChance) + tier.minChance,
  }));
}

/**
 * Pick a rarity tier according to its weighted session chance.
 * Returns one tier object: higher chance is picked more often.
 *
 * @param sessionTiers - array from assignSessionChances
 */
function pickWeightedRarity(
  sessionTiers: Array<{ name: string; color: string; chance: number }>,
): (typeof sessionTiers)[number] {
  const total = sessionTiers.reduce((sum, tier) => sum + tier.chance, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const tier of sessionTiers) {
    acc += tier.chance;
    if (r <= acc) return tier;
  }
  return sessionTiers[sessionTiers.length - 1]; // fallback
}

/**
 * Generate a full catalog of items, with:
 * - At least one item guaranteed for each rarity tier.
 * - All other items distributed by session rarity chance.
 *
 * @param totalItems - total count of catalog items to generate
 * @param sessionTiers - session rarity array from assignSessionChances
 * @returns CatalogItem[] ready for DB seeding
 */
export function generateCatalogItems(
  totalItems: number,
  sessionTiers: Array<{ name: string; color: string; chance: number }>,
): CatalogItem[] {
  const items: CatalogItem[] = [];

  // One guaranteed item per rarity tier
  sessionTiers.forEach((tier) => {
    items.push({
      itemId: crypto.randomUUID(),
      name: generateItemName(),
      description: generateDescription(tier.name),
      rarity: tier.name,
      rarityChance: tier.chance,
      rarityColor: tier.color,
      createdAt: new Date().toISOString(),
    });
  });

  // Remaining items with weighted random rarity
  for (let i = sessionTiers.length; i < totalItems; i++) {
    const tier = pickWeightedRarity(sessionTiers);
    items.push({
      itemId: crypto.randomUUID(),
      name: generateItemName(),
      description: generateDescription(tier.name),
      rarity: tier.name,
      rarityChance: tier.chance,
      rarityColor: tier.color,
      createdAt: new Date().toISOString(),
    });
  }

  return items;
}
