import * as dynamo from "../core/dynamodb";
import { Item, Player, Tables } from "../types";
import { generateCollectables } from "./seeder/collectables";
import { generatePlayers } from "./seeder/players";
import { generateItems } from "../utils/itemGeneration";
import { generateTrades } from "./seeder/trades";
import { populateRarities, assignSessionChances } from "./seeder/rarities";

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

    const rarities = populateRarities();
    await seedTable(Tables.Rarities, rarities);

    const sessionTiers = assignSessionChances(rarities);
    const players = generatePlayers(250);
    const collectables = generateCollectables(250, sessionTiers);
    const items = generateItems(players, collectables, rarities, 1000);

    const testUser = players.find((p) => p.email === "test@test.com");
    if (testUser) {
      const testUserItems: Item[] = [];
      for (let i = 0; i < 25; i++) {
        testUserItems.push(generateItems([testUser], collectables, rarities, 1)[0]);
      }
      items.push(...testUserItems);
    }

    const trades = generateTrades(players, items, 500);

    await seedTable(Tables.Collectables, collectables);
    await seedTable(Tables.Players, players);
    await seedTable(Tables.Items, items);
    await seedTable(Tables.Trades, trades);

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

    console.log("\n🎉 Database seeding complete!");
    console.log("📊 Final data counts:");
    console.log(`  - Rarities: ${rarities.length}`);
    console.log(`  - Collectables: ${collectables.length}`);
    console.log(`  - Players: ${players.length}`);
    console.log(`  - Items: ${items.length}`);
    console.log(`  - Trades: ${trades.length}`);

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

seedAllTables();
