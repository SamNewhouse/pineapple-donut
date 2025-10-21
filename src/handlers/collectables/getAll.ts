import { APIGatewayProxyHandler } from "aws-lambda";
import { success, handleError } from "../../lib/http";
import { getAllCollectables } from "../../functions/collectables";

/**
 * Get all items from the Collectales
 *
 * Retrieves all item definitions from the Collectales table.
 *
 * @returns Array of collectales
 *
 * Security: No authentication required - catalog is public
 * Use case: Item browser, item selection menus
 */
export const handler: APIGatewayProxyHandler = async (_event) => {
  try {
    const collectables = await getAllCollectables();

    return success({
      collectables,
      total: collectables.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
