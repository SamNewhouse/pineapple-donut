import { Rarity, Tables } from "../types";
import * as Dynamodb from "../lib/dynamodb";

/**
 * Rarity tier configuration for item catalog generation.
 *
 * Each tier provides:
 * - name: Rarity label
 * - color: Theme color for UI/badges
 * - minChance, maxChance: Decimal range for spawn/drop rate
 *
 * At runtime, assignSessionChances() will pick a random chance within min/max for each tier.
 * This enables dynamic balancing for game sessions.
 */
export const rarityTiers: Rarity[] = [
  { id: 0, name: "Common", color: "#9CA3AF", minChance: 0.22, maxChance: 0.28 }, // 1 in 4.5–3.6
  { id: 1, name: "Uncommon", color: "#10B981", minChance: 0.18, maxChance: 0.23 }, // 1 in 5.6–4.3
  { id: 2, name: "Rare", color: "#3B82F6", minChance: 0.13, maxChance: 0.17 }, // 1 in 7.7–5.9
  { id: 3, name: "Epic", color: "#8B5CF6", minChance: 0.09, maxChance: 0.13 }, // 1 in 11.1–7.7
  { id: 4, name: "Legendary", color: "#F59E0B", minChance: 0.06, maxChance: 0.09 }, // 1 in 16.7–11.1
  { id: 5, name: "Fabled", color: "#B91C1C", minChance: 0.03, maxChance: 0.06 }, // 1 in 33.3–16.7
  { id: 6, name: "Mythic", color: "#EF4444", minChance: 0.013, maxChance: 0.03 }, // 1 in 76.9–33.3
  { id: 7, name: "Divine", color: "#EC4899", minChance: 0.006, maxChance: 0.013 }, // 1 in 166.7–76.9
  { id: 8, name: "Astral", color: "#818CF8", minChance: 0.001, maxChance: 0.003 }, // 1 in 1000–333.3
  { id: 9, name: "Celestial", color: "#14B8A6", minChance: 0.0006, maxChance: 0.0015 }, // 1 in 1667–667
  { id: 10, name: "Transcendent", color: "#F97316", minChance: 0.0003, maxChance: 0.00065 }, // 1 in 3333–1538
  { id: 11, name: "Ethereal", color: "#6366F1", minChance: 0.00014, maxChance: 0.00032 }, // 1 in 7142–3125
  { id: 12, name: "Primordial", color: "#84CC16", minChance: 0.00006, maxChance: 0.00015 }, // 1 in 16667–6667
  { id: 13, name: "Arcane", color: "#DB2777", minChance: 0.000025, maxChance: 0.000065 }, // 1 in 40,000–15,385
];

/**
 * Get all Rarities from the DB.
 *
 * @returns Array of Rarities items
 */
export async function getAllRarities(): Promise<Rarity[]> {
  return Dynamodb.scan(Tables.Rarities);
}
