import { DynamoDB } from "aws-sdk";
import fs from "fs";
import path from "path";

const endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const tableName = "ItemCatalog";

const dynamodb = new DynamoDB.DocumentClient({
  endpoint,
  region: "localhost",
  accessKeyId: "dummy",
  secretAccessKey: "dummy",
});

const catalogFile = path.resolve(__dirname, "../data/items-catalog.json");
const items: any[] = JSON.parse(fs.readFileSync(catalogFile, "utf8"));

async function seedCatalog() {
  for (const item of items) {
    try {
      await dynamodb.put({ TableName: tableName, Item: item }).promise();
      console.log(`Seeded: ${item.itemId}`);
    } catch (err: any) {
      console.error(`Error seeding ${item.itemId}:`, err.message);
    }
  }
  console.log("ItemCatalog seeding complete.");
}

seedCatalog();
