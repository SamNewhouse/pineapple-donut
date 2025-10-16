import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, error, parseBody, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Collectable, Item, AwardedItem } from "../../types";
import * as crypto from "crypto";
import { rarityTiers } from "../../data/rarity";

/**
 * Process a barcode scan and award a random item to the player
 *
 * This function handles the core game mechanic where players scan barcodes
 * to discover new items. It randomly selects an item from the catalog
 * and creates a new item record for the player.
 *
 * @param event - API Gateway event containing id and barcode in the request body
 * @returns Success response with awarded item details or error response
 *
 * Flow:
 * 1. Parse and validate request parameters
 * 2. Fetch all available catalog items
 * 3. Randomly select one item from the catalog
 * 4. Create a new item record for the player
 * 5. Return the awarded item information
 */
export const processScan: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse request body to extract player ID and barcode
    const { id, barcode }: { id: string; barcode: string } = parseBody(event.body);

    // Validate required parameters
    if (!id || !barcode) {
      return badRequest("id and barcode required");
    }

    // Retrieve all items from the catalog for random selection
    const collectables: Collectable[] = await Dynamodb.scan(Tables.Collectables);

    // Ensure catalog has items available for awarding
    if (collectables.length === 0) {
      return error("No items in catalog", 500);
    }

    // Randomly select an item from the catalog
    // This is where the "discovery" element happens - players never know what they'll get
    const randomIndex = Math.floor(Math.random() * collectables.length);
    const winner: Collectable = collectables[randomIndex];

    // Create a unique item instance for this player
    // Each scan creates a new item record, even if it's the same catalog item
    const uniqueItemId = crypto.randomUUID();
    const itemRecord: Item = {
      id: uniqueItemId,
      collectableId: winner.id,
      playerId: id,
      foundAt: new Date().toISOString(),
    };

    // Store the new item in the player's collection
    await Dynamodb.put(Tables.Items, itemRecord);

    // Get rarity information for the awarded item
    const rarityInfo = rarityTiers.find((rt) => rt.name === winner.rarity);

    // Create the properly typed AwardedItem response
    const awardedItem: AwardedItem = {
      // Spread all Collectable properties
      ...winner,
      // Add the AwardedItem-specific properties
      collectableId: winner.id,
      rarityMinChance: rarityInfo?.minChance ?? 0,
      rarityMaxChance: rarityInfo?.maxChance ?? 0,
    };

    // Return success response with properly typed item details
    return success(
      {
        awardedItem,
        id,
        foundAt: itemRecord.foundAt,
      },
      200,
      "Item awarded successfully",
    );
  } catch (error) {
    return handleError(error);
  }
};
