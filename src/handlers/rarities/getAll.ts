import { APIGatewayProxyHandler } from "aws-lambda";
import { success, handleError } from "../../lib/http";
import { Rarity } from "../../types";
import { getAllRarities } from "../../functions/rarities";

/**
 * Get all rarity tiers from the Rarities table
 *
 * Retrieves all rarity tier definitions from the Rarities table.
 *
 * @returns Array of rarity tiers
 *
 * Security: No authentication required - rarities config is public
 * Use case: LocalStorage for app, rarity browser, item info, probability guides
 */
export const handler: APIGatewayProxyHandler = async (_event) => {
  try {
    const rarities: Rarity[] = await getAllRarities();

    return success({
      rarities,
      total: rarities.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
