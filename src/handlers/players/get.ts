import { APIGatewayProxyHandler } from "aws-lambda";
import { badRequest, notFound, success, handleError } from "../../lib/http";
import { Player } from "../../types";
import { getPlayer } from "../../functions/players";

/**
 * Get player public profile information.
 *
 * Privacy: Only non-sensitive data (username, totalScans) is ever returned,
 * regardless of auth context. Secret fields like email and createdAt are never sent.
 *
 * @param event - API Gateway event with playerId in path
 * @returns Player public profile data or error
 *
 * Use Cases:
 * - Player profile pages
 * - Trading partner information
 * - Social features and player discovery
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id required");

    const player: Player | null = await getPlayer(id);
    if (!player) return notFound("Player not found");

    return success({
      id: player.id,
      username: player.username,
      totalScans: player.totalScans,
    });
  } catch (error) {
    return handleError(error);
  }
};
