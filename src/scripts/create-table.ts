import { DynamoDB } from "aws-sdk";

const endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

// Dummy credentials for local dev
const dynamodb = new DynamoDB({
  endpoint,
  region: "localhost",
  accessKeyId: "dummy",
  secretAccessKey: "dummy",
});

// Table definitions
type TableDefinition = DynamoDB.CreateTableInput;

const tables: TableDefinition[] = [
  {
    TableName: "ItemCatalog",
    AttributeDefinitions: [{ AttributeName: "itemId", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "itemId", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Players",
    AttributeDefinitions: [{ AttributeName: "playerId", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "playerId", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Items",
    AttributeDefinitions: [
      { AttributeName: "playerId", AttributeType: "S" },
      { AttributeName: "itemId", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "playerId", KeyType: "HASH" },
      { AttributeName: "itemId", KeyType: "RANGE" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
];

async function createTables(): Promise<void> {
  for (const params of tables) {
    try {
      await dynamodb.createTable(params).promise();
      console.log(`Created table '${params.TableName}'`);
    } catch (err: any) {
      if (err.code === "ResourceInUseException") {
        console.log(`Table '${params.TableName}' already exists.`);
      } else {
        console.error(
          `Unable to create table '${params.TableName}':`,
          JSON.stringify(err, null, 2),
        );
      }
    }
  }
  console.log("All tables processed.");
}

createTables();
