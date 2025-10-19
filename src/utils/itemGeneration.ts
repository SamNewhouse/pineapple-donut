import * as crypto from "crypto";
import { Collectable, Item, Player, Rarity } from "../types";

// Quality calculation (exponential curve)
function rollQuality(): number {
  const x = Math.random();
  const expFactor = 6.66;
  const quality = Math.floor(100 * Math.pow(x, expFactor)) + 1;
  return Math.min(quality, 100);
}

// Calculate chance from rarity and quality
function calcChance(rarity: Rarity, quality: number): number {
  const scaledQuality = Math.min(1, Math.max(0, (quality + Math.random()) / 101));
  const baseChance = rarity.minChance + (rarity.maxChance - rarity.minChance) * scaledQuality;
  const maxNoise = rarity.maxChance - baseChance;
  const noise = Math.random() * Math.min(maxNoise, (rarity.maxChance - rarity.minChance) * 1e-8);
  const chance = baseChance + noise;
  return Number(chance.toFixed(18));
}

// Simple direct weighting (no curve) for collectable selection based on linear chance
function computeCollectableWeight(rarity: Rarity): number {
  return (rarity.minChance + rarity.maxChance) / 2;
}

// Weighted collectable selection (no exponential curve)
function rollCollectable(collectables: Collectable[], rarities: Rarity[]): Collectable {
  if (collectables.length === 0) throw new Error("No collectables provided");
  const weights = collectables.map((collectable) => {
    const rarity = rarities.find((r) => r.id === collectable.rarity);
    if (!rarity)
      console.warn(`Collectable ${collectable.id} has unknown rarity ${collectable.rarity}`);
    return rarity ? computeCollectableWeight(rarity) : 1;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normalized = weights.map((w) => w / totalWeight);
  let r = Math.random();
  for (let i = 0; i < collectables.length; i++) {
    r -= normalized[i];
    if (r <= 0) {
      return collectables[i];
    }
  }
  // If rounding fails, return a random collectable as fallback
  return collectables[Math.floor(Math.random() * collectables.length)];
}

// Generate a single item
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
  const chance = calcChance(rarity, quality);
  return {
    id: crypto.randomUUID(),
    collectableId: collectable.id,
    playerId: player.id,
    quality,
    chance,
    foundAt: foundAt || new Date().toISOString(),
  };
}

// Bulk generate items
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
    items.push(generateItem(player, collectables, rarities, foundAt));
  }
  return items;
}
