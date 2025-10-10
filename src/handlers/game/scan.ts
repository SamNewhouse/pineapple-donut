import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, error, parseBody, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables } from "../../types";
import * as crypto from "crypto";

/**
 * Process a barcode scan and award a random item to the player
 * Uses weighted random selection based on item rarity
 */
export const processScan: APIGatewayProxyHandler = async (event) => {
  try {
    const { playerId, barcode } = parseBody(event.body);

    if (!playerId || !barcode) {
      return badRequest("playerId and barcode required");
    }

    // 1. Load all items from ItemCatalog
    const catalogItems = await Dynamodb.scan(Tables.ItemCatalog);

    if (catalogItems.length === 0) {
      return error("No items in catalog", 500);
    }

    // 2. Simple random selection
    const randomIndex = Math.floor(Math.random() * catalogItems.length);
    const winner = catalogItems[randomIndex];

    // 3. Create unique item instance
    const uniqueItemId = crypto.randomUUID();
    const itemRecord = {
      itemId: uniqueItemId,
      catalogItemId: winner.itemId,
      playerId: playerId,
      foundAt: new Date().toISOString(),
      barcodeUsed: barcode,
      name: winner.name,
      rarity: winner.rarity,
      description: winner.description,
    };

    await Dynamodb.put(Tables.Items, itemRecord);

    return success(
      {
        awardedItem: {
          itemId: uniqueItemId,
          catalogItemId: winner.itemId,
          name: winner.name,
          rarity: winner.rarity,
        },
        playerId,
        foundAt: itemRecord.foundAt,
      },
      200,
      "Item awarded successfully",
    );
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Validate a barcode scan before processing
 * Checks format and whether player has already scanned this barcode
 */
export const validateScan: APIGatewayProxyHandler = async (event) => {
  try {
    const { playerId, barcode } = parseBody(event.body);

    if (!playerId || !barcode) {
      return badRequest("playerId and barcode required");
    }

    // Basic format check
    if (typeof barcode !== "string" || barcode.length < 8) {
      return success({
        valid: false,
        reason: "Invalid barcode format",
        alreadyScanned: false,
      });
    }

    // Check if player has already scanned this barcode
    // Need to scan all items to check barcodes (could add GSI for better performance)
    const allItems = await Dynamodb.scan(Tables.Items);
    const playerItems = allItems.filter((item) => item.playerId === playerId);
    const alreadyScanned = playerItems.some((item) => item.barcodeUsed === barcode);

    return success({
      valid: true,
      alreadyScanned,
      reason: alreadyScanned ? "Barcode already scanned by this player" : null,
    });
  } catch (error) {
    return handleError(error);
  }
};
