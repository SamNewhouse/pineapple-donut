import * as dynamo from "../core/dynamodb";
import * as crypto from "crypto";
import { Item, Player, Tables } from "../types";
import { generateCollectables } from "./seeder/collectables";
import { generatePlayers } from "./seeder/players";
import { generateItems } from "./seeder/items";
import { generateTrades } from "./seeder/trades";
import { populateRarities, assignSessionChances } from "./seeder/rarities"; // Import from rarities.ts

/**
 * Seed a DynamoDB table by inserting provided data, with error-resilient logging for each item.
 */
async function seedTable(tableName: string, data: any[]): Promise<void> {
  console.log(`Seeding ${tableName} with ${data.length} items...`);
  let successCount = 0;
  for (const item of data) {
    try {
      await dynamo.put(tableName, item);
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`  ✅ Seeded ${successCount}/${data.length} items...`);
      }
    } catch (error) {
      console.error(`  ❌ Error seeding ${tableName}:`, error);
    }
  }
  console.log(`✅ ${tableName} seeding complete (${successCount}/${data.length} items)\n`);
}

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

    // 1. Seed rarities first (source of truth)
    const rarities = populateRarities();
    await seedTable(Tables.Rarities, rarities);

    // 2. Generate session tiers using canonical assignSessionChances from rarities.ts
    const sessionTiers = assignSessionChances(rarities);
    const players = generatePlayers(250);
    const collectables = generateCollectables(250, sessionTiers);
    const items = generateItems(players, collectables, rarities, 1000);
    const trades = generateTrades(players, items, 500);

    // Attach 25 real collectables to "test@test.com" user
    const testUser = players.find((p) => p.email === "test@test.com");
    if (testUser) {
      // Create a lookup map for rarity configs by id
      const rarityMap = new Map(rarities.map((r) => [r.id, r]));

      const chosenCollectables = collectables.sort(() => Math.random() - 0.5).slice(0, 25);
      const testUserItems: Item[] = chosenCollectables.map((collectable) => {
        const rarityConfig = rarityMap.get(collectable.rarity);
        let chance = 0;
        if (rarityConfig) {
          chance =
            Math.random() * (rarityConfig.maxChance - rarityConfig.minChance) +
            rarityConfig.minChance;
        }
        return {
          id: crypto.randomUUID(),
          playerId: testUser.id,
          collectableId: collectable.id,
          chance: parseFloat(chance.toFixed(8)),
          foundAt: new Date().toISOString(),
        };
      });
      items.push(...testUserItems);
    }

    // 3. Seed all other tables
    await seedTable(Tables.Collectables, collectables);
    await seedTable(Tables.Players, players);
    await seedTable(Tables.Items, items);
    await seedTable(Tables.Trades, trades);

    // Print test user accounts (only first 5)
    console.log("👥 Sample test user accounts:");
    players.slice(0, 5).forEach((player: Player) => {
      const itemCount = items.filter((item) => item.playerId === player.id).length;
      const tradeCount = trades.filter(
        (trade) => trade.fromPlayerId === player.id || trade.toPlayerId === player.id,
      ).length;
      console.log(
        `  - ${player.username} (${player.email}) - Items: ${itemCount}, Trades: ${tradeCount}`,
      );
    });

    // Final summary
    console.log("\n🎉 Database seeding complete!");
    console.log("📊 Final data counts:");
    console.log(`  - Rarities: ${rarities.length}`);
    console.log(`  - Collectables: ${collectables.length}`);
    console.log(`  - Players: ${players.length}`);
    console.log(`  - Items: ${items.length}`);
    console.log(`  - Trades: ${trades.length}`);

    // Rarity distribution
    if (collectables.length > 0) {
      const rarityCount = collectables.reduce(
        (acc, item) => {
          acc[item.rarity] = (acc[item.rarity] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      console.log("\n🎲 Rarity Distribution:");
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

// Execute the seeding process
seedAllTables();
