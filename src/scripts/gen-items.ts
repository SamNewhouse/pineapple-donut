import fs from "fs";
import path from "path";

type Rarity = { chance: number };

type Item = {
  itemId: string;
  name: string;
  rarityChance: number;
};

const rarities: Rarity[] = [
  { chance: 0.22 },
  { chance: 0.18 },
  { chance: 0.14 },
  { chance: 0.1 },
  { chance: 0.08 },
  { chance: 0.06 },
  { chance: 0.05 },
  { chance: 0.04 },
  { chance: 0.03 },
  { chance: 0.025 },
  { chance: 0.02 },
  { chance: 0.012 },
  { chance: 0.0075 },
  { chance: 0.004 },
  { chance: 0.003 },
  { chance: 0.0015 },
  { chance: 0.0008 },
  { chance: 0.00015 },
  { chance: 0.00005 },
];

const totalItems = 100;
const items: Item[] = [];

// Step 1: Ensure at least one of each rarity
rarities.forEach((rarity, i) => {
  items.push({
    itemId: `item${String(i + 1).padStart(3, "0")}`,
    name: `Collectible Item ${i + 1}`,
    rarityChance: rarity.chance,
  });
});

// Step 2: Fill in the rest randomly (excluding the ones guaranteed above)
for (let i = rarities.length; i < totalItems; i++) {
  const rarityIdx = Math.floor(Math.random() * rarities.length);
  const rarity = rarities[rarityIdx];

  items.push({
    itemId: `item${String(i + 1).padStart(3, "0")}`,
    name: `Collectible Item ${i + 1}`,
    rarityChance: rarity.chance,
  });
}

fs.writeFileSync(
  path.resolve(__dirname, "../data/items-catalog.json"),
  JSON.stringify(items, null, 2),
);

console.log("Generated items-catalog.json with 100 items and guaranteed at least one per rarity!");
