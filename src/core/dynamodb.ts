import { DynamoDB } from "aws-sdk";

/**
 * Singleton DynamoDB DocumentClient instance
 * Reused across all Lambda function invocations for better performance
 */
let dynamoClient: DynamoDB.DocumentClient | null = null;

/**
 * Gets or creates a singleton DynamoDB DocumentClient instance
 * Automatically configures endpoint for local development when DYNAMODB_ENDPOINT is set
 * @returns Configured DynamoDB DocumentClient
 */
function getInstance(): DynamoDB.DocumentClient {
  if (!dynamoClient) {
    dynamoClient = new DynamoDB.DocumentClient({
      endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
    });
  }
  return dynamoClient;
}

/**
 * Retrieves a single item from DynamoDB by primary key
 * @param tableName - Name of the DynamoDB table
 * @param key - Primary key object (e.g., { id: "123" } or { pk: "user", sk: "profile" })
 * @returns The item if found, null if not found
 */
export async function get(tableName: string, key: Record<string, any>): Promise<any> {
  const client = getInstance();
  const result = await client
    .get({
      TableName: tableName,
      Key: key,
    })
    .promise();
  return result.Item || null;
}

/**
 * Scans entire table and returns all items
 * WARNING: Use carefully on large tables - can be expensive
 * @param tableName - Name of the DynamoDB table
 * @param filterExpression - Optional filter to apply to results
 * @param expressionAttributeValues - Values for the filter expression
 * @returns Array of all items matching the filter (empty array if none found)
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
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  const result = await client.scan(params).promise();
  return result.Items || [];
}

/**
 * Creates or replaces an item in DynamoDB
 * @param tableName - Name of the DynamoDB table
 * @param item - The item object to store (must include primary key)
 */
export async function put(tableName: string, item: Record<string, any>): Promise<void> {
  const client = getInstance();
  await client
    .put({
      TableName: tableName,
      Item: item,
    })
    .promise();
}

/**
 * Queries items from DynamoDB using a key condition
 * More efficient than scan for retrieving multiple items with known key patterns
 * @param tableName - Name of the DynamoDB table
 * @param keyConditionExpression - Query condition (e.g., "pk = :pk AND sk BEGINS_WITH :sk")
 * @param expressionAttributeValues - Values for the condition (e.g., { ":pk": "user", ":sk": "profile" })
 * @param indexName - Optional GSI/LSI name to query against
 * @returns Array of matching items (empty array if none found)
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
    ExpressionAttributeValues: expressionAttributeValues,
  };

  if (indexName) {
    params.IndexName = indexName;
  }

  const result = await client.query(params).promise();
  return result.Items || [];
}

/**
 * Updates an existing item in DynamoDB
 * @param tableName - Name of the DynamoDB table
 * @param key - Primary key of the item to update
 * @param updateExpression - Update expression (e.g., "SET #name = :name, #score = :score")
 * @param expressionAttributeValues - Values for the update (e.g., { ":name": "John", ":score": 100 })
 * @returns The updated item attributes (after the update)
 */
export async function update(
  tableName: string,
  key: Record<string, any>,
  updateExpression: string,
  expressionAttributeValues: Record<string, any>,
): Promise<any> {
  const client = getInstance();
  const result = await client
    .update({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
    .promise();
  return result.Attributes;
}

/**
 * Deletes an item from DynamoDB by primary key
 * @param tableName - Name of the DynamoDB table
 * @param key - Primary key of the item to delete
 */
export async function deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
  const client = getInstance();
  await client
    .delete({
      TableName: tableName,
      Key: key,
    })
    .promise();
}
