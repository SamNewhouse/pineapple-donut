import { APIGatewayProxyHandler } from "aws-lambda";
import { success, handleError } from "../../lib/http";
import { getAllPlayers } from "../../functions/players";
import { Player } from "../../types";

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
    const players: Player[] = await getAllPlayers();

    return success({
      players,
      total: players.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
