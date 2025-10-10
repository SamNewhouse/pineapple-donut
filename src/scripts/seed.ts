import { DynamoDB } from "aws-sdk";
import * as crypto from "crypto";
import fs from "fs";
import path from "path";

const endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

// DocumentClient for easier data operations
const dynamodb = new DynamoDB.DocumentClient({
  endpoint,
  region: "localhost",
  accessKeyId: "dummy",
  secretAccessKey: "dummy",
});

// Load catalog items from JSON file
const catalogFile = path.resolve(__dirname, "data/items-catalog.json");
const catalogItems: any[] = JSON.parse(fs.readFileSync(catalogFile, "utf8"));

// Sample players
const players = [
  {
    playerId: "player-001",
    username: "DragonSlayer",
    email: "dragon@example.com",
    passwordHash: "$2b$10$example.hash.for.password123", // bcrypt hash
    createdAt: new Date().toISOString()
  },
  {
    playerId: "player-002", 
    username: "MysticMage",
    email: "mystic@example.com",
    passwordHash: "$2b$10$example.hash.for.password456",
    createdAt: new Date().toISOString()
  },
  {
    playerId: "player-003",
    username: "ShadowHunter", 
    email: "shadow@example.com",
    passwordHash: "$2b$10$example.hash.for.password789",
    createdAt: new Date().toISOString()
  }
];

// Generate sample items using catalog data (if catalog has items)
const generateItems = () => {
  if (catalogItems.length === 0) return [];
  
  const items = [];
  const playerIds = players.map(p => p.playerId);
  
  // Give each player a few random items
  for (let i = 0; i < 6; i++) {
    const randomCatalogItem = catalogItems[Math.floor(Math.random() * catalogItems.length)];
    const randomPlayer = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    items.push({
      itemId: crypto.randomUUID(),
      catalogItemId: randomCatalogItem.itemId,
      playerId: randomPlayer,
      foundAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last week
      barcodeUsed: `${1000000000000 + Math.floor(Math.random() * 9000000000000)}` // Random 13-digit barcode
    });
  }
  
  return items;
};

const items = generateItems();

// Generate sample trades using actual item IDs
const generateTrades = () => {
  if (items.length < 2) return [];
  
  return [
    {
      tradeId: crypto.randomUUID(),
      fromPlayerId: "player-001",
      toPlayerId: "player-002", 
      offeredItemIds: items.slice(0, 1).map(item => item.itemId),
      requestedItemIds: items.slice(1, 2).map(item => item.itemId),
      status: "pending",
      createdAt: new Date().toISOString()
    },
    {
      tradeId: crypto.randomUUID(),
      fromPlayerId: "player-002",
      toPlayerId: "player-003",
      offeredItemIds: items.slice(2, 3).map(item => item.itemId),
      requestedItemIds: items.slice(3, 4).map(item => item.itemId),
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() // 30 min later
    }
  ];
};

const trades = generateTrades();

async function seedTable(tableName: string, data: any[]): Promise<void> {
  console.log(`Seeding ${tableName} with ${data.length} items...`);
  
  for (const item of data) {
    try {
      await dynamodb.put({
        TableName: tableName,
        Item: item
      }).promise();
      console.log(`Seeded: ${item.itemId || item.playerId || item.tradeId}`);
    } catch (error) {
      console.error(`Error seeding ${tableName}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${tableName} successfully`);
}

async function seedAllTables(): Promise<void> {
  try {
    console.log("🌱 Starting database seeding...\n");
    
    // Seed in dependency order
    await seedTable("ItemCatalog", catalogItems);
    await seedTable("Players", players);
    await seedTable("Items", items);
    await seedTable("Trades", trades);
    
    console.log("\n🎉 All tables seeded successfully!");
    console.log("\nSample data created:");
    console.log(`- ${catalogItems.length} catalog items (from JSON)`);
    console.log(`- ${players.length} players`);
    console.log(`- ${items.length} item instances`);
    console.log(`- ${trades.length} trades`);
    
    console.log("\nTest users:");
    players.forEach(player => {
      console.log(`- ${player.username} (${player.email}) - ID: ${player.playerId}`);
    });
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seedAllTables();
