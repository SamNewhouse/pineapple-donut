import * as dynamo from "../core/dynamodb";
import { Player, Tables } from "../types";
import { assignSessionChances, generateCatalogItems } from "./seeder/catalog";
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
  for (const item of data) {
    try {
      await dynamo.put(tableName, item);
      // Log unique identifier for each item type
      const identifier = item.itemId || item.playerId || item.tradeId || "unknown";
      console.log(`  ✅ Seeded: ${identifier}`);
    } catch (error) {
      console.error(`  ❌ Error seeding ${tableName}:`, error);
    }
  }
  console.log(`✅ ${tableName} seeding complete\n`);
}

function formatChance(value: number): string {
  // Show as whole % if whole number, else fixed up to 8 decimals (remove trailing zeros)
  if (value >= 1) {
    return `${Math.floor(value)}%`;
  }
  const str = value.toFixed(8); // e.g. "0.00010000"
  // Remove trailing zeros but keep at least two decimals after dot
  return `${parseFloat(str)}%`;
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
    const catalogItems = generateCatalogItems(250, sessionTiers);
    const items = generateItems(players, catalogItems, 5000);
    const trades = generateTrades(players, items, 500);

    // Seed tables in dependency order to avoid referential integrity issues
    await seedTable(Tables.ItemCatalog, catalogItems);
    await seedTable(Tables.Players, players);
    await seedTable(Tables.Items, items);
    await seedTable(Tables.Trades, trades);

    // Print test user accounts for game and UI dev
    console.log("👥 Test user accounts:");
    players.forEach((player: Player) => {
      const itemCount = items.filter((item) => item.playerId === player.playerId).length;
      const tradeCount = trades.filter(
        (trade) => trade.fromPlayerId === player.playerId || trade.toPlayerId === player.playerId,
      ).length;
      console.log(
        `  - ${player.playerId} - ${player.username} (${player.email}) - Items: ${itemCount}, Trades: ${tradeCount}`,
      );
    });

    // Seeding summary
    console.log("🎉 All tables seeded successfully!\n");
    console.log("📊 Sample data created:");
    console.log(`  - ${catalogItems.length} catalog items (procedurally generated)`);
    console.log(`  - ${players.length} test players`);
    console.log(`  - ${items.length} item instances`);
    console.log(`  - ${trades.length} sample trades\n`);

    // Rarity distribution summary for experimental balancing/game economy
    const rarityCount = catalogItems.reduce(
      (acc, item) => {
        acc[item.rarity] = (acc[item.rarity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log("\n🎲 Catalog Rarity Distribution:");
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
          `  ${rarity.padEnd(15)}: ${count.toString().padStart(2)} items ` +
            `(${formatChance(minChance * 100)} - ${formatChance(maxChance * 100)})`,
        );
      });

    function formatChance(value: number): string {
      // If it's 1 or greater, show integer only
      if (value >= 1) {
        return `${Math.floor(value)}%`;
      }
      // Otherwise, show all necessary decimals—no trailing zeroes
      const str = value.toFixed(8);
      return `${str.replace(/\.?0+$/, "")}%`;
    }

    // Final dev instructions
    console.log("\n💡 You can now:");
    console.log("  - Test authentication with the sample users above");
    console.log("  - View items in the admin UI at http://localhost:8001");
    console.log("  - Start the API with 'npm run dev'");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Execute the seeding process (default entrypoint)
seedAllTables();
