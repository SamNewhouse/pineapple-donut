import * as dynamo from "../core/dynamodb";
import { Player, Tables } from "../types";
import { assignSessionChances, generateCollectables } from "./seeder/collectables";
import { generatePlayers } from "./seeder/players";
import { generateItems } from "./seeder/items";
import { generateTrades } from "./seeder/trades";
import { rarityTiers } from "../data/rarity";

/**
 * Seed a DynamoDB table by inserting provided data,
 * with error-resilient logging for each item.
 *
 * @param tableName - Name of the DynamoDB table to seed
 * @param data - Array of items to insert
 */
async function seedTable(tableName: string, data: any[]): Promise<void> {
  console.log(`Seeding ${tableName} with ${data.length} items...`);
  let successCount = 0;
  for (const item of data) {
    try {
      await dynamo.put(tableName, item);
      successCount++;
      // Only log every 50 items for less spam
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
  // If it's 1 or greater, show integer only
  if (value >= 1) {
    return `${Math.floor(value)}%`;
  }
  // Otherwise, show all necessary decimals—no trailing zeroes
  const str = value.toFixed(8);
  return `${str.replace(/\.?0+$/, "")}%`;
}

/**
 * Orchestrates full seeding procedure, seeding all DB tables in dependency order.
 * Provides comprehensive logging, statistics, and test user details.
 */
async function seedAllTables(): Promise<void> {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Generate all test data in-memory
    const players = generatePlayers(250);
    const sessionTiers = assignSessionChances();
    const collectables = generateCollectables(250, sessionTiers);
    const items = generateItems(players, collectables, 1000);
    const trades = generateTrades(players, items, 500);

    // Debug logging only if trades fail to generate
    if (trades.length === 0) {
      console.log("⚠️  No trades generated - debugging...");
      const itemsByPlayer = items.reduce(
        (acc, item) => {
          acc[item.playerId] = (acc[item.playerId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const playersWithItems = Object.keys(itemsByPlayer).length;
      console.log(`  - Players with items: ${playersWithItems}/${players.length}`);
      console.log(`  - Sample player items:`, Object.entries(itemsByPlayer).slice(0, 5));
      console.log(); // Add space
    }

    // Seed tables in dependency order
    await seedTable(Tables.Collectables, collectables);
    await seedTable(Tables.Players, players);
    await seedTable(Tables.Items, items);
    await seedTable(Tables.Trades, trades);

    // Print test user accounts (only first 5 for readability)
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
    console.log(`  - Collectables: ${collectables.length}`);
    console.log(`  - Players: ${players.length}`);
    console.log(`  - Items: ${items.length}`);
    console.log(`  - Trades: ${trades.length}`);

    // Rarity distribution (only if collectables exist)
    if (collectables.length > 0) {
      const rarityCount = collectables.reduce(
        (acc, item) => {
          acc[item.rarity] = (acc[item.rarity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log("\n🎲 Rarity Distribution:");
      Object.entries(rarityCount)
        .sort(([rarityA], [rarityB]) => {
          const chanceA = sessionTiers.find((tier) => tier.name === rarityA)?.chance || 0;
          const chanceB = sessionTiers.find((tier) => tier.name === rarityB)?.chance || 0;
          return chanceB - chanceA;
        })
        .forEach(([rarity, count]) => {
          const configTier = rarityTiers.find((tier) => tier.name === rarity);
          const minChance = configTier?.minChance ?? 0;
          const maxChance = configTier?.maxChance ?? 0;
          console.log(
            `  ${rarity.padEnd(15)}: ${count.toString().padStart(3)} items ` +
              `(${formatChance(minChance * 100)} - ${formatChance(maxChance * 100)})`,
          );
        });
    }

    console.log("\n💡 Next steps:");
    console.log("  - View data at: http://localhost:8001");
    console.log("  - Start API: npm run dev");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Execute the seeding process
seedAllTables();
