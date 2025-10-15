import { CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { getClient } from "../core/dynamodb";

/**
 * List all tables in the DynamoDB instance
 * @returns Array of table names
 */
async function listTables(): Promise<string[]> {
  const client = getClient();
  const result = await client.send(new ListTablesCommand({}));
  return result.TableNames || [];
}

/**
 * Create a table in DynamoDB
 * @param tableConfig - DynamoDB table configuration
 * @returns Promise that resolves when table is created
 */
async function createTable(tableConfig: any): Promise<void> {
  const client = getClient();
  await client.send(new CreateTableCommand(tableConfig));
}

/**
 * Check if a table exists
 * @param tableName - Name of the table to check
 * @returns true if table exists, false otherwise
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const tables = await listTables();
    return tables.includes(tableName);
  } catch (error) {
    return false;
  }
}

async function createTables() {
  console.log("🏗️  Creating DynamoDB tables in Docker...");

  try {
    // Check existing tables
    const existingTables = await listTables();
    console.log("Existing tables:", existingTables);

    const tables = [
      // ItemCatalog Table
      {
        TableName: "ItemCatalog",
        AttributeDefinitions: [{ AttributeName: "itemId", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "itemId", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST",
      },

      // Players Table
      {
        TableName: "Players",
        AttributeDefinitions: [
          { AttributeName: "playerId", AttributeType: "S" },
          { AttributeName: "email", AttributeType: "S" },
        ],
        KeySchema: [{ AttributeName: "playerId", KeyType: "HASH" }],
        GlobalSecondaryIndexes: [
          {
            IndexName: "EmailIndex",
            KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
            Projection: { ProjectionType: "ALL" },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      },

      // Items Table
      {
        TableName: "Items",
        AttributeDefinitions: [
          { AttributeName: "itemId", AttributeType: "S" },
          { AttributeName: "playerId", AttributeType: "S" },
        ],
        KeySchema: [{ AttributeName: "itemId", KeyType: "HASH" }],
        GlobalSecondaryIndexes: [
          {
            IndexName: "PlayerIndex",
            KeySchema: [{ AttributeName: "playerId", KeyType: "HASH" }],
            Projection: { ProjectionType: "ALL" },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      },

      // Trades Table
      {
        TableName: "Trades",
        AttributeDefinitions: [
          { AttributeName: "tradeId", AttributeType: "S" },
          { AttributeName: "fromPlayerId", AttributeType: "S" },
          { AttributeName: "toPlayerId", AttributeType: "S" },
        ],
        KeySchema: [{ AttributeName: "tradeId", KeyType: "HASH" }],
        GlobalSecondaryIndexes: [
          {
            IndexName: "FromPlayerIndex",
            KeySchema: [{ AttributeName: "fromPlayerId", KeyType: "HASH" }],
            Projection: { ProjectionType: "ALL" },
          },
          {
            IndexName: "ToPlayerIndex",
            KeySchema: [{ AttributeName: "toPlayerId", KeyType: "HASH" }],
            Projection: { ProjectionType: "ALL" },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      },
    ];

    for (const tableConfig of tables) {
      try {
        const exists = await tableExists(tableConfig.TableName);
        if (exists) {
          console.log(`✅ Table '${tableConfig.TableName}' already exists`);
          continue;
        }

        console.log(`Creating table '${tableConfig.TableName}'...`);
        await createTable(tableConfig);
        console.log(`✅ Table '${tableConfig.TableName}' created successfully`);
      } catch (error: any) {
        if (error.name === "ResourceInUseException") {
          console.log(`✅ Table '${tableConfig.TableName}' already exists`);
        } else {
          console.error(`❌ Failed to create table '${tableConfig.TableName}':`, error.message);
        }
      }
    }

    console.log("🎉 Table creation complete!");
    console.log("📊 Check your tables at: http://localhost:8001");
  } catch (error: any) {
    console.error("❌ Error creating tables:", error.message);
    process.exit(1);
  }
}

createTables();
