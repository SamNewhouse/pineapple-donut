import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
  region: 'localhost'
});

export const getPlayerInventory: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Fetch all items owned by player
    return {
      statusCode: 200,
      body: JSON.stringify({
        inventory: [
          { itemId: "item1", name: "Rare Card", rarity: "rare", value: 50, quantity: 1 },
          { itemId: "item2", name: "Common Sticker", rarity: "common", value: 5, quantity: 3 },
        ],
        totalValue: 65,
      }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};

export const addItemToInventory: APIGatewayProxyHandler = async (event) => {
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const playerId = event.pathParameters?.playerId || "demo-player-id";
    const { item } = body; // Expected: { item: { itemId, name, rarity, value } }

    const params = {
      TableName: process.env.DYNAMODB_TABLE!,
      Item: {
        pk: `PLAYER#${playerId}`,
        sk: `ITEM#${item.itemId}`,
        ...item
      }
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Item added", item }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) errorMessage = error.message;
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};

export const removeItemFromInventory: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Remove item from player inventory (for trading)
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, itemRemoved: "item1" }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
