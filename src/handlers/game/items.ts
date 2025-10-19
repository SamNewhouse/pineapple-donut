import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Item } from "../../types";
import { parseAuthToken } from "../../core/auth";

/**
 * Get details of a specific item by its ID
 *
 * Retrieves a single item record from the database. This endpoint can be used
 * to get detailed information about any item, regardless of ownership.
 * Useful for item inspection, trading previews, or detailed views.
 *
 * @param event - API Gateway event with itemId in path parameters
 * @returns Item details or 404 if not found
 *
 * Security: No authentication required - items are publicly viewable
 * Use case: Item details page, trading system item preview
 */
export const getItem: APIGatewayProxyHandler = async (event) => {
  try {
    const itemId = event.pathParameters?.itemId;

    if (!itemId) {
      return badRequest("itemId required");
    }

    const item: Item | null = await Dynamodb.get(Tables.Items, { id: itemId });

    if (!item) {
      return notFound("Item not found");
    }

    return success({
      id: item.id,
      collectableId: item.collectableId,
      playerId: item.playerId,
      foundAt: item.foundAt,
      quality: item.quality,
      chance: item.chance,
    });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Get all items belonging to a specific player (player inventory)
 *
 * Retrieves the complete collection of items for a player. This endpoint
 * supports both authenticated and unauthenticated access:
 * - Authenticated: Can view own inventory with full details
 * - Unauthenticated: Can view any player's inventory (public collections)
 *
 * The response includes an `isOwnInventory` flag to help the client
 * determine if additional actions (like trading) should be available.
 *
 * @param event - API Gateway event with playerId in path parameters and optional Authorization header
 * @returns List of player's items with metadata
 *
 * Security: Optional authentication - public inventories are viewable by all
 * Use case: Inventory page, collection browsing, trading partner item viewing
 */
export const getAll: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;

    if (!playerId) {
      return badRequest("playerId required");
    }

    let isOwnInventory = false;
    try {
      const currentUser = parseAuthToken(event.headers.Authorization);
      isOwnInventory = currentUser.playerId === playerId;
    } catch {
      isOwnInventory = false;
    }

    const playerItems: Item[] = await Dynamodb.query(
      Tables.Items,
      "playerId = :playerId",
      { ":playerId": playerId },
      "PlayerIndex",
    );

    if (playerItems.length === 0) {
      return success({
        items: [],
        totalItems: 0,
        message: "No items found for this player",
        isOwnInventory,
      });
    }

    const items = playerItems.map((item: Item) => ({
      id: item.id,
      collectableId: item.collectableId,
      foundAt: item.foundAt,
      quality: item.quality,
      chance: item.chance,
    }));

    return success({
      items,
      totalItems: items.length,
      isOwnInventory,
    });
  } catch (error) {
    return handleError(error);
  }
};
