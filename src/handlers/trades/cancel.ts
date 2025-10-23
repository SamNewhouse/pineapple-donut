import { APIGatewayProxyHandler } from "aws-lambda";
import { badRequest, error, handleError, notFound, success } from "../../lib/http";
import { parseAuthToken } from "../../functions/auth";
import { Trade, TradeStatus } from "../../types";
import { getTrade, updateTradeStatus } from "../../functions/trades";

/**
 * Cancel a trade offer (by creator).
 * Marks the trade as CANCELLED.
 *
 * Validations:
 *  - Only original sender may cancel
 *  - Trade must be pending
 *
 * @param event - API Gateway event with id in path and auth token
 * @returns Success response or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id is required");

    const currentUser = parseAuthToken(event.headers.Authorization);

    const trade = await getTrade(id);
    if (!trade) return notFound("Trade not found");

    if (currentUser.playerId !== trade.fromPlayerId) {
      return error("You are not allowed to cancel this trade", 403);
    }

    await updateTradeStatus(id, TradeStatus.REJECTED);

    return success({ message: "Trade cancelled" });
  } catch (err) {
    return handleError(err);
  }
};
