import { APIGatewayProxyHandler } from "aws-lambda";
import { success, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Collectable } from "../../types";

/**
 * Get all items from the ItemCatalog
 *
 * Retrieves all item definitions from the ItemCatalog table.
 *
 * @returns Array of catalog items
 *
 * Security: No authentication required - catalog is public
 * Use case: Item browser, item selection menus
 */
export const getAll: APIGatewayProxyHandler = async (_event) => {
  try {
    // Scan the ItemCatalog table to fetch all catalog items
    const Collectables: Collectable[] = await Dynamodb.scan(Tables.Collectables);

    // Return all catalog items and their count
    return success({
      items: Collectables,
      totalItems: Collectables.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
