import * as dynamo from "../lib/dynamodb";
import { Item, Player, Tables } from "../types";
import { generateCollectables } from "./seeder/collectables";
import { generatePlayers } from "./seeder/players";
import { generateItems } from "../functions/items";
import { generateTrades } from "./seeder/trades";
import { populateRarities, assignSessionChances } from "./seeder/rarities";
import { generateAchievements } from "./seeder/achievements";

/**
 * Seed a DynamoDB table by inserting provided data, with error-resilient logging for each item.
 */
async function seedTable(tableName: string, data: any[]): Promise<void> {
  console.log(`Seeding ${tableName} with ${data.length} items...`);
  for (const item of data) {
    try {
      await dynamo.put(tableName, item);
    } catch (error) {
      console.error(`  ❌ Error seeding ${tableName}:`, error);
    }
  }
}

async function generateAndSeed<T>(
  tableName: string,
  generator: () => T[],
  postProcess?: (data: T[]) => T[] | void,
): Promise<T[]> {
  const start = performance.now();
  let data = generator();
  if (postProcess) {
    const result = postProcess(data);
    if (result) data = result;
  }
  await seedTable(tableName, data);
  const end = performance.now();

  console.log(
    `✅ ${tableName} generated & seeded in ${((end - start) / 1000).toFixed(3)}s (${data.length} items)\n`,
  );
  return data;
}

/**
 * Format a chance percentage with up to eight decimal places if needed.
 */
function formatChance(value: number): string {
  if (value >= 1) return `${Math.floor(value)}%`;
  const str = value.toFixed(8);
  return `${str.replace(/\.?0+$/, "")}%`;
}

/**
 * Orchestrates full seeding procedure, seeding all DB tables in dependency order.
 * Provides robust logging, statistics, and test user details.
 */
async function seedAllTables(): Promise<void> {
  try {
    console.log("🌱 Starting database seeding...\n");

    const rarities = await generateAndSeed(Tables.Rarities, populateRarities);
    const players = await generateAndSeed(Tables.Players, () => generatePlayers(75));
    const sessionTiers = assignSessionChances(rarities);
    const collectables = await generateAndSeed(Tables.Collectables, () =>
      generateCollectables(sessionTiers, 75),
    );
    const achievements = await generateAndSeed(Tables.Achievements, () => generateAchievements(35));
    const items = await generateAndSeed(
      Tables.Items,
      () => generateItems(players, collectables, rarities, 1500),
      (items) => {
        const testUser = players.find((p) => p.email === "test@test.com");
        if (testUser) {
          for (let i = 0; i < 63; i++) {
            items.push(generateItems([testUser], collectables, rarities, 1)[0]);
          }
        }
        return items;
      },
    );
    const trades = await generateAndSeed(Tables.Trades, () => generateTrades(players, items, 45));

    console.log("🎉 Database seeding complete!");
    console.log("📊 Final data counts:");
    console.log(`  - Rarities: ${rarities.length}`);
    console.log(`  - Collectables: ${collectables.length}`);
    console.log(`  - Players: ${players.length}`);
    console.log(`  - Items: ${items.length}`);
    console.log(`  - Trades: ${trades.length}`);
    console.log(`  - Achievements: ${achievements.length}`);

    // Collectables Distribution by Rarity
    if (collectables.length > 0) {
      const rarityCount = collectables.reduce(
        (acc, item) => {
          acc[item.rarity] = (acc[item.rarity] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      console.log("\n🎲 Collectables Distribution:");
      Object.entries(rarityCount)
        .sort(([rarityA], [rarityB]) => {
          const chanceA = sessionTiers.find((tier) => tier.id === Number(rarityA))?.chance || 0;
          const chanceB = sessionTiers.find((tier) => tier.id === Number(rarityB))?.chance || 0;
          return chanceB - chanceA;
        })
        .forEach(([rarity, count]) => {
          const configTier = rarities.find((tier) => tier.id === Number(rarity));
          const minChance = configTier?.minChance ?? 0;
          const maxChance = configTier?.maxChance ?? 0;
          const name = configTier?.name ?? rarity;
          console.log(
            `${name.padEnd(15)}: ${count.toString().padStart(3)} collectables ` +
              `(${formatChance(minChance * 100)} - ${formatChance(maxChance * 100)})`,
          );
        });
    }

    // Items Distribution by Rarity
    if (items.length > 0) {
      // Get rarity for each item by looking up its collectable's rarity
      const itemRarityCount = items.reduce(
        (acc, item) => {
          const collectable = collectables.find((c) => c.id === item.collectableId);
          const rarityId = collectable?.rarity ?? -1;
          acc[rarityId] = (acc[rarityId] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      console.log("\n🏆 Items Distribution:");
      Object.entries(itemRarityCount)
        .sort(([rarityA], [rarityB]) => {
          const chanceA = sessionTiers.find((tier) => tier.id === Number(rarityA))?.chance || 0;
          const chanceB = sessionTiers.find((tier) => tier.id === Number(rarityB))?.chance || 0;
          return chanceB - chanceA;
        })
        .forEach(([rarity, count]) => {
          const configTier = rarities.find((tier) => tier.id === Number(rarity));
          const minChance = configTier?.minChance ?? 0;
          const maxChance = configTier?.maxChance ?? 0;
          const name = configTier?.name ?? rarity;
          console.log(
            `${name.padEnd(15)}: ${count.toString().padStart(3)} items ` +
              `(${formatChance(minChance * 100)} - ${formatChance(maxChance * 100)})`,
          );
        });
    }

    console.log("\nView data at: http://localhost:8001");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedAllTables();
