import { APIGatewayProxyHandler } from "aws-lambda";
import { success, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Rarity } from "../../types";

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
export const getAll: APIGatewayProxyHandler = async (_event) => {
  try {
    const rarities: Rarity[] = await Dynamodb.scan(Tables.Rarities);

    return success({
      items: rarities,
      totalItems: rarities.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
