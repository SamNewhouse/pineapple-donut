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
    // Extract item ID from URL path parameters
    const itemId = event.pathParameters?.itemId;

    // Validate required parameter
    if (!itemId) {
      return badRequest("itemId required");
    }

    // Fetch item from database
    const item: Item | null = await Dynamodb.get(Tables.Items, { itemId });

    // Return 404 if item doesn't exist
    if (!item) {
      return notFound("Item not found");
    }

    // Return item details (all fields since this is a single item lookup)
    return success({
      itemId: item.itemId,
      catalogItemId: item.catalogItemId,
      playerId: item.playerId,
      foundAt: item.foundAt,
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
    // Extract player ID from URL path parameters
    const playerId = event.pathParameters?.playerId;

    // Validate required parameter
    if (!playerId) {
      return badRequest("playerId required");
    }

    // Determine if the requester is viewing their own inventory
    // This affects UI presentation and available actions
    let isOwnInventory = false;
    try {
      const currentUser = parseAuthToken(event.headers.Authorization);
      isOwnInventory = currentUser.playerId === playerId;
    } catch {
      // Invalid or missing auth token - treat as public viewing
      isOwnInventory = false;
    }

    // Query all items belonging to the specified player
    // Uses PlayerIndex GSI for efficient querying by playerId
    const playerItems: Item[] = await Dynamodb.query(
      Tables.Items,
      "playerId = :playerId",
      { ":playerId": playerId },
      "PlayerIndex",
    );

    // Handle empty inventory case
    if (playerItems.length === 0) {
      return success({
        items: [],
        totalItems: 0,
        message: "No items found for this player",
      });
    }

    // Transform items for response - exclude playerId since it's redundant
    // (we already know which player we're querying for)
    const items = playerItems.map((item: Item) => ({
      itemId: item.itemId,
      catalogItemId: item.catalogItemId,
      foundAt: item.foundAt,
    }));

    // Return inventory with metadata for client-side processing
    return success({
      items,
      totalItems: items.length,
      isOwnInventory, // Helps client show/hide trade buttons, edit options, etc.
    });
  } catch (error) {
    return handleError(error);
  }
};
