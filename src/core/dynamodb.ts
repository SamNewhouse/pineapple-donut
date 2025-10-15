import {
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import {
  DYNAMODB_ENDPOINT,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION_FALLBACK,
} from "../config/variables";

/**
 * Singleton DynamoDB Client instance
 * Reused across all Lambda function invocations for better performance
 */
let dynamoClient: DynamoDBClient | null = null;

/**
 * Gets or creates a singleton DynamoDB Client instance
 *
 * Configuration priority:
 * 1. Local development: Uses DYNAMODB_ENDPOINT if set (for Docker DynamoDB Local)
 * 2. AWS Lambda: Uses default AWS SDK configuration with region from environment
 * 3. Fallback: Uses fallback region from environment or hardcoded default
 *
 * Local Development Setup:
 * - Uses dummy credentials for Docker DynamoDB Local
 * - Points to http://localhost:8000 endpoint
 * - Bypasses AWS authentication
 *
 * @returns Configured DynamoDB Client
 */
function getInstance(): DynamoDBClient {
  if (!dynamoClient) {
    const config: any = {};

    // For local development with Docker DynamoDB Local
    if (DYNAMODB_ENDPOINT) {
      config.endpoint = DYNAMODB_ENDPOINT;
      config.credentials = {
        accessKeyId: AWS_ACCESS_KEY_ID || "dummy",
        secretAccessKey: AWS_SECRET_ACCESS_KEY || "dummy",
      };
    }

    // Set region with fallback chain
    config.region = AWS_REGION || AWS_REGION_FALLBACK || "eu-west-2";

    dynamoClient = new DynamoDBClient(config);
  }
  return dynamoClient;
}

/**
 * Get the DynamoDB client instance (exposed for scripts and utilities)
 * @returns Configured DynamoDB Client
 */
export function getClient(): DynamoDBClient {
  return getInstance();
}

/**
 * Retrieves a single item from DynamoDB by primary key
 *
 * Performs a consistent read operation to get the most up-to-date data.
 * This is the most efficient way to retrieve a single item when you know
 * the complete primary key (partition key and sort key if applicable).
 *
 * @param tableName - Name of the DynamoDB table
 * @param key - Primary key object (e.g., { id: "123" } or { pk: "user", sk: "profile" })
 * @returns The item if found, null if not found
 *
 * Example:
 * ```
 * const player = await get("Players", { playerId: "123" });
 * const item = await get("Items", { itemId: "abc-def" });
 * ```
 */
export async function get(tableName: string, key: Record<string, any>): Promise<any> {
  const client = getInstance();
  const params = {
    TableName: tableName,
    Key: marshall(key),
    ConsistentRead: true, // Ensure we get the latest data
  };
  const result = await client.send(new GetItemCommand(params));
  return result.Item ? unmarshall(result.Item) : null;
}

/**
 * Scans entire table and returns all items
 *
 * WARNING: Use carefully on large tables - this operation:
 * - Reads every item in the table (expensive)
 * - Consumes significant read capacity
 * - Can hit Lambda timeout limits on large tables
 * - Should generally be avoided in production
 *
 * Better alternatives:
 * - Use query() if you know partition key patterns
 * - Use pagination for large result sets
 * - Consider using DynamoDB Streams for bulk operations
 *
 * @param tableName - Name of the DynamoDB table
 * @param filterExpression - Optional filter to apply to results (applied after scan)
 * @param expressionAttributeValues - Values for the filter expression
 * @returns Array of all items matching the filter (empty array if none found)
 *
 * Example:
 * ```
 * const allItems = await scan("ItemCatalog"); // Get entire catalog
 * const rareItems = await scan("Items", "rarity = :rarity", { ":rarity": "legendary" });
 * ```
 */
export async function scan(
  tableName: string,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, any>,
): Promise<any[]> {
  const client = getInstance();
  const params: any = {
    TableName: tableName,
  };

  if (filterExpression) {
    params.FilterExpression = filterExpression;
  }

  if (expressionAttributeValues) {
    params.ExpressionAttributeValues = marshall(expressionAttributeValues);
  }

  const result = await client.send(new ScanCommand(params));
  return result.Items ? result.Items.map((item) => unmarshall(item)) : [];
}

/**
 * Creates or replaces an item in DynamoDB
 *
 * This operation will:
 * - Create a new item if it doesn't exist
 * - Completely replace an existing item (not merge)
 * - Overwrite all attributes of existing items
 *
 * For partial updates, use the update() function instead.
 *
 * @param tableName - Name of the DynamoDB table
 * @param item - The item object to store (must include primary key)
 *
 * Example:
 * ```
 * await put("Players", {
 *   playerId: "123",
 *   username: "player1",
 *   email: "test@example.com"
 * });
 * ```
 */
export async function put(tableName: string, item: Record<string, any>): Promise<void> {
  const client = getInstance();
  await client.send(
    new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
    }),
  );
}

/**
 * Queries items from DynamoDB using a key condition
 *
 * Much more efficient than scan() for retrieving multiple items because:
 * - Uses indexes for fast lookups
 * - Only reads items that match the key condition
 * - Supports pagination for large result sets
 * - Can use GSI/LSI for different access patterns
 *
 * Key Condition Requirements:
 * - Must specify partition key equality (pk = :value)
 * - Can optionally specify sort key conditions (sk > :value, BEGINS_WITH, etc.)
 * - Cannot query without partition key
 *
 * @param tableName - Name of the DynamoDB table
 * @param keyConditionExpression - Query condition (e.g., "pk = :pk AND sk BEGINS_WITH :sk")
 * @param expressionAttributeValues - Values for the condition (e.g., { ":pk": "user", ":sk": "profile" })
 * @param indexName - Optional GSI/LSI name to query against
 * @returns Array of matching items (empty array if none found)
 *
 * Example:
 * ```
 * // Query player's items using GSI
 * const playerItems = await query(
 *   "Items",
 *   "playerId = :playerId",
 *   { ":playerId": "123" },
 *   "PlayerIndex"
 * );
 *
 * // Query player by email using GSI
 * const players = await query(
 *   "Players",
 *   "email = :email",
 *   { ":email": "test@example.com" },
 *   "EmailIndex"
 * );
 * ```
 */
export async function query(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, any>,
  indexName?: string,
): Promise<any[]> {
  const client = getInstance();
  const params: any = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
  };

  if (indexName) {
    params.IndexName = indexName;
  }

  const result = await client.send(new QueryCommand(params));
  return result.Items ? result.Items.map((item) => unmarshall(item)) : [];
}

/**
 * Updates an existing item in DynamoDB with partial modifications
 *
 * This operation:
 * - Only modifies specified attributes (doesn't replace entire item)
 * - Can add new attributes or update existing ones
 * - Can increment/decrement numeric values
 * - Can append to lists or add to sets
 * - Returns the updated item after modification
 *
 * Update Expression Syntax:
 * - SET: Set attribute values (SET #name = :name)
 * - ADD: Add to numeric values or sets (ADD score :increment)
 * - REMOVE: Remove attributes (REMOVE oldAttribute)
 * - DELETE: Delete from sets (DELETE stringSet :valueToRemove)
 *
 * @param tableName - Name of the DynamoDB table
 * @param key - Primary key of the item to update
 * @param updateExpression - Update expression (e.g., "SET #name = :name, #score = :score")
 * @param expressionAttributeValues - Values for the update (e.g., { ":name": "John", ":score": 100 })
 * @param expressionAttributeNames - Optional attribute name mappings for reserved words
 * @returns The updated item attributes (after the update)
 *
 * Example:
 * ```
 * // Update player stats
 * await update(
 *   "Players",
 *   { playerId: "123" },
 *   "SET totalScans = totalScans + :increment",
 *   { ":increment": 1 }
 * );
 *
 * // Update trade status
 * await update(
 *   "Trades",
 *   { tradeId: "abc" },
 *   "SET #status = :status, completedAt = :timestamp",
 *   { ":status": "completed", ":timestamp": "2023-01-01T00:00:00Z" },
 *   { "#status": "status" } // Handle reserved word
 * );
 * ```
 */
export async function update(
  tableName: string,
  key: Record<string, any>,
  updateExpression: string,
  expressionAttributeValues: Record<string, any>,
  expressionAttributeNames?: Record<string, string>,
): Promise<any> {
  const client = getInstance();
  const params: any = {
    TableName: tableName,
    Key: marshall(key),
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
    ReturnValues: "ALL_NEW" as const, // Return the item after update
  };

  // Add attribute name mappings if provided (for reserved words like 'status')
  if (expressionAttributeNames) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  const result = await client.send(new UpdateItemCommand(params));
  return result.Attributes ? unmarshall(result.Attributes) : null;
}

/**
 * Deletes an item from DynamoDB by primary key
 *
 * This operation:
 * - Permanently removes the item from the table
 * - Is idempotent (won't error if item doesn't exist)
 * - Cannot be undone (consider soft deletes for important data)
 * - Frees up storage space and reduces costs
 *
 * @param tableName - Name of the DynamoDB table
 * @param key - Primary key of the item to delete
 *
 * Example:
 * ```
 * // Delete a player
 * await deleteItem("Players", { playerId: "123" });
 *
 * // Delete a trade
 * await deleteItem("Trades", { tradeId: "abc-def" });
 * ```
 */
export async function deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
  const client = getInstance();
  await client.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: marshall(key),
    }),
  );
}
