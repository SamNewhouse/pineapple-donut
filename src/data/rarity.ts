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
export const rarityTiers = [
  { name: "Common", color: "#9CA3AF", minChance: 0.18, maxChance: 0.25 },
  { name: "Uncommon", color: "#10B981", minChance: 0.14, maxChance: 0.2 },
  { name: "Rare", color: "#3B82F6", minChance: 0.09, maxChance: 0.15 },
  { name: "Epic", color: "#8B5CF6", minChance: 0.06, maxChance: 0.12 },
  { name: "Legendary", color: "#F59E0B", minChance: 0.04, maxChance: 0.09 },
  { name: "Fabled", color: "#B91C1C", minChance: 0.03, maxChance: 0.07 },
  { name: "Mythic", color: "#EF4444", minChance: 0.02, maxChance: 0.06 },
  { name: "Divine", color: "#EC4899", minChance: 0.015, maxChance: 0.05 },
  { name: "Astral", color: "#818CF8", minChance: 0.01, maxChance: 0.04 },
  { name: "Celestial", color: "#14B8A6", minChance: 0.008, maxChance: 0.035 },
  { name: "Transcendent", color: "#F97316", minChance: 0.007, maxChance: 0.03 },
  { name: "Empyrean", color: "#F7AB1B", minChance: 0.005, maxChance: 0.025 },
  { name: "Ethereal", color: "#6366F1", minChance: 0.004, maxChance: 0.02 },
  { name: "Primordial", color: "#84CC16", minChance: 0.0025, maxChance: 0.015 },
  { name: "Void", color: "#1F2937", minChance: 0.0018, maxChance: 0.012 },
  { name: "Arcane", color: "#DB2777", minChance: 0.0014, maxChance: 0.01 },
  { name: "Cosmic", color: "#7C3AED", minChance: 0.001, maxChance: 0.008 },
  { name: "Omnipotent", color: "#DC2626", minChance: 0.0005, maxChance: 0.005 },
  { name: "Infinite", color: "#059669", minChance: 0.0003, maxChance: 0.003 },
  { name: "Quantum", color: "#7C2D12", minChance: 0.0001, maxChance: 0.001 },
  { name: "Singularity", color: "#BE123C", minChance: 0.000025, maxChance: 0.0002 },
  { name: "Universal", color: "#7E22CE", minChance: 0.000006, maxChance: 0.00008 },
  { name: "Omniversal", color: "#000000", minChance: 0.000001, maxChance: 0.00001 },
  { name: "Apocryphal", color: "#525252", minChance: 0.0000001, maxChance: 0.000001 },
];
