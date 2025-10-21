import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, error, parseBody, handleError } from "../../lib/http";
import * as Dynamodb from "../../lib/dynamodb";
import { Tables, Collectable, Item } from "../../types";
import { generateItem } from "../../functions/items";
import { rarityTiers } from "../../functions/rarities";

/**
 * Process a barcode scan and award a random item to the player
 *
 * This function handles the core game mechanic where players scan barcodes
 * to discover new items. It randomly selects an item from the catalog
 * and creates a new item record for the player.
 *
 * @param event - API Gateway event containing id in the request body
 * @returns Success response with awarded item details or error response
 *
 * Flow:
 * 1. Parse and validate request parameters
 * 2. Fetch all available catalog items
 * 3. Randomly select one item from the catalog
 * 4. Create a new item record for the player
 * 5. Return the awarded item information
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { id }: { id: string } = parseBody(event.body);

    if (!id) {
      return badRequest("id and barcode required");
    }

    const collectables: Collectable[] = await Dynamodb.scan(Tables.Collectables);

    if (collectables.length === 0) {
      return error("No items in catalog", 500);
    }

    const awarded: Item = generateItem(id, collectables, rarityTiers);

    await Dynamodb.put(Tables.Items, awarded);

    return success(awarded, 200, "Item awarded successfully");
  } catch (error) {
    return handleError(error);
  }
};
