// src/handlers/game/items.ts
import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables } from "../../types";
import { parseAuthToken } from "../../core/auth";

/**
 * Get details of a specific item instance
 */
export const getItem: APIGatewayProxyHandler = async (event) => {
  try {
    const itemId = event.pathParameters?.itemId;

    if (!itemId) {
      return badRequest("itemId required");
    }

    const item = await Dynamodb.get(Tables.Items, { itemId });

    if (!item) {
      return notFound("Item not found");
    }

    return success({
      itemId: item.itemId,
      catalogItemId: item.catalogItemId,
      playerId: item.playerId,
      foundAt: item.foundAt,
      barcodeUsed: item.barcodeUsed
    });

  } catch (error) {
    return handleError(error);
  }
};

/**
 * Get all items owned by a specific player (their inventory)
 */
export const getAll: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;

    if (!playerId) {
      return badRequest("playerId required");
    }

    // Check if requesting user wants to see their own inventory (for privacy)
    let isOwnInventory = false;
    try {
      const currentUser = parseAuthToken(event.headers.Authorization);
      isOwnInventory = currentUser.playerId === playerId;
    } catch {
      // No valid token = viewing as guest
      isOwnInventory = false;
    }

    // Get all items for this player
    const playerItems = await Dynamodb.query(
      Tables.Items,
      "playerId = :playerId",
      { ":playerId": playerId },
      "PlayerIndex"
    );

    if (playerItems.length === 0) {
      return success({
        items: [],
        totalItems: 0,
        message: "No items found for this player"
      });
    }

    // Return minimal item data
    const items = playerItems.map(item => ({
      itemId: item.itemId,
      catalogItemId: item.catalogItemId,
      foundAt: item.foundAt,
      // Only show sensitive data to owner
      ...(isOwnInventory && {
        barcodeUsed: item.barcodeUsed
      })
    }));

    return success({
      items,
      totalItems: items.length,
      isOwnInventory
    });

  } catch (error) {
    return handleError(error);
  }
};
