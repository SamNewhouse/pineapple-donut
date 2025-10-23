import * as crypto from "crypto";
import { Collectable, Item, Player, Rarity, Tables } from "../types";
import * as Dynamodb from "../lib/dynamodb";

/**
 * Generates a random integer between 1 and 100 to represent item quality,
 * skewed toward low values with an exponential curve for rarity.
 *
 * - Produces more common items with lower average quality.
 * - Maximum possible quality is capped at 100.
 *
 * @returns {number} Integer quality score [1, 100]
 */
function rollQuality(): number {
  const x = Math.random();
  const expFactor = 6.66;
  const quality = Math.floor(100 * Math.pow(x, expFactor)) + 1;
  return Math.min(quality, 100);
}

/**
 * Calculates the probability ("chance") for an item based on its rarity and quality.
 *
 * - Linearly interpolates between rarity's min/max chance according to item's (randomized) quality.
 * - Introduces minor random "noise" within allowed upper bound.
 * - Result is a floating-point value in [rarity.minChance, rarity.maxChance].
 *
 * @param rarity   - The rarity definition for this item
 * @param quality  - The item's quality score [1, 100]
 * @returns        - Probability value representing item find chance
 */
function calcChance(rarity: Rarity, quality: number): number {
  const scaledQuality = Math.min(1, Math.max(0, (quality + Math.random()) / 101));
  const baseChance = rarity.minChance + (rarity.maxChance - rarity.minChance) * scaledQuality;
  const maxNoise = rarity.maxChance - baseChance;
  const noise = Math.random() * Math.min(maxNoise, (rarity.maxChance - rarity.minChance) * 1e-8);
  const chance = baseChance + noise;
  return Number(chance.toFixed(18));
}

/**
 * Computes a simple average-based weight for a given rarity.
 * Used for probability-weighted collectable selection.
 *
 * @param rarity  - The rarity definition
 * @returns       - Numeric weight score for selection
 */
function computeCollectableWeight(rarity: Rarity): number {
  return (rarity.minChance + rarity.maxChance) / 2;
}

/**
 * Selects a collectable based on rarity weighting.
 *
 * - Each collectable is assigned a weight based on its rarity.
 * - Items are chosen with probability proportional to their rarity's average chance.
 * - If rounding or lookup fails, a fallback random collectable is returned.
 *
 * @param collectables - Pool of available Collectable definitions
 * @param rarities     - Array of Rarity definitions for lookup
 * @returns            - Randomly selected Collectable
 */
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

/**
 * Generates a single Item instance for a given player.
 *
 * - Randomly selects a collectable for the player, weighted by rarity.
 * - Determines item quality (exponentially weighted).
 * - Calculates find chance based on quality and rarity.
 * - Assigns a creation timestamp (now or provided).
 *
 * @param playerId     - Player to receive the item
 * @param collectables - Pool of available collectables
 * @param rarities     - Array of rarity definitions
 * @param foundAt      - Optional ISO string timestamp (defaults to now)
 * @returns            - A generated Item object
 */
export function generateItem(
  playerId: string,
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
    playerId: playerId,
    quality,
    chance,
    foundAt: foundAt || new Date().toISOString(),
  };
}

/**
 * Generates a batch of Item instances for multiple players.
 *
 * - Randomly distributes items among provided players.
 * - Each item is generated using current rarity, collectable, and quality logic.
 * - Simulates acquisition times over the last week for variety.
 *
 * @param players      - Array of Player records
 * @param collectables - Array of available Collectable types
 * @param rarities     - Array of Rarity definitions
 * @param count        - Total number of items to generate
 * @returns            - Array of generated Item objects
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
    items.push(generateItem(player.id, collectables, rarities, foundAt));
  }
  return items;
}

/**
 * Retrieves a single item by its unique identifier.
 *
 * @param itemId - The UUID or primary key of the item to retrieve
 * @returns      - The Item object if found, or null if not found
 *
 * @example
 *   const item = await getItemById("item-uuid-123");
 *   if (!item) { ... handle not found ... }
 */
export async function getItemById(itemId: string): Promise<Item | null> {
  return Dynamodb.get(Tables.Items, { id: itemId });
}

export async function getAllItems(): Promise<Item[]> {
  return Dynamodb.scan(Tables.Items);
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
export async function getItemsByPlayer(playerId: string): Promise<Item[]> {
  return Dynamodb.query(
    Tables.Items,
    "playerId = :playerId",
    { ":playerId": playerId },
    "PlayerIndex",
  );
}
