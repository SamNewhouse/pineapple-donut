import { APIGatewayProxyHandler } from "aws-lambda";
import { badRequest, handleError, notFound, success } from "../../lib/http";
import { getPlayerTrades } from "../../functions/trades";

/**
 * List all trades involving a player (sent or received).
 *
 * Returns trades sent by this player and received by this player, for dashboards or history.
 *
 * @param event - API Gateway event with id in path
 * @returns Success response with trade lists and summary count or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id is required");

    const { sentTrades, receivedTrades } = await getPlayerTrades(id);

    return success({
      sentTrades,
      receivedTrades,
      totalTrades: sentTrades.length + receivedTrades.length,
    });
  } catch (err) {
    return handleError(err);
  }
};
