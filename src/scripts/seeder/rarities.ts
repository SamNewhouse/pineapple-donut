import { rarityTiers } from "../../functions/rarities";
import { Rarity } from "../../types";

/** Returns canonical array of Rarity objects to seed. */
export function populateRarities(): Rarity[] {
  return rarityTiers.map((r) => ({
    id: r.id,
    name: r.name,
    minChance: r.minChance,
    maxChance: r.maxChance,
    color: r.color,
  }));
}

/** Assigns session rarity tiers (with a random chance) for item generation. */
export function assignSessionChances(
  rarities: Rarity[],
): Array<{ id: number; name: string; color: string; chance: number }> {
  return rarities.map((tier) => ({
    id: tier.id,
    name: tier.name,
    color: tier.color,
    chance: Math.random() * (tier.maxChance - tier.minChance) + tier.minChance,
  }));
}

/** Weighted selector, used for collectable distribution. */
export function pickWeightedRarityId(sessionTiers: Array<{ id: number; chance: number }>): number {
  const total = sessionTiers.reduce((sum, tier) => sum + tier.chance, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const tier of sessionTiers) {
    acc += tier.chance;
    if (r <= acc) return tier.id;
  }
  return sessionTiers[sessionTiers.length - 1].id;
}
