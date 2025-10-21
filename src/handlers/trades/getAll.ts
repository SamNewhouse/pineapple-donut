import { APIGatewayProxyHandler } from "aws-lambda";
import { badRequest, handleError, notFound, success } from "../../lib/http";
import { getPlayerTrades } from "../../functions/trades";

/**
 * List all trades involving a player (sent or received).
 *
 * Returns trades sent by this player and received by this player, for dashboards or history.
 *
 * @param event - API Gateway event with playerId in path
 * @returns Success response with trade lists and summary count or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;
    if (!playerId) return badRequest("playerId is required");

    const { sentTrades, receivedTrades } = await getPlayerTrades(playerId);

    return success({
      sentTrades,
      receivedTrades,
      totalTrades: sentTrades.length + receivedTrades.length,
    });
  } catch (err) {
    return handleError(err);
  }
};
