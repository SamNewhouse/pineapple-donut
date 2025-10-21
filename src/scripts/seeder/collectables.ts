import { rarityTiers } from "../../functions/rarities";
import { Collectable, Rarity } from "../../types";
import { generateDescription } from "../data/descriptions";
import { generateCollectableName } from "../data/words";

// Pick weighted rarity id by session chance
function pickWeightedRarityId(sessionTiers: Array<{ id: number; chance: number }>): number {
  const total = sessionTiers.reduce((sum, tier) => sum + tier.chance, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const tier of sessionTiers) {
    acc += tier.chance;
    if (r <= acc) return tier.id;
  }
  return sessionTiers[sessionTiers.length - 1].id; // fallback
}

export function generateCollectables(
  totalCollectables: number,
  sessionTiers: Array<{ id: number; chance: number }>,
): Collectable[] {
  const collectables: Collectable[] = [];

  // One guaranteed item per rarity tier
  sessionTiers.forEach((tier) => {
    collectables.push({
      id: crypto.randomUUID(),
      name: generateCollectableName(),
      description: generateDescription(
        rarityTiers.find((rt: Rarity) => rt.id === tier.id)?.name ?? "Unknown",
      ),
      rarity: tier.id,
      createdAt: new Date().toISOString(),
    });
  });

  // Remaining items, weighted random rarity
  for (let i = sessionTiers.length; i < totalCollectables; i++) {
    const rarityId = pickWeightedRarityId(sessionTiers);
    collectables.push({
      id: crypto.randomUUID(),
      name: generateCollectableName(),
      description: generateDescription(
        rarityTiers.find((rt: Rarity) => rt.id === rarityId)?.name ?? "Unknown",
      ),
      rarity: rarityId,
      createdAt: new Date().toISOString(),
    });
  }

  return collectables;
}
