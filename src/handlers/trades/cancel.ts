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
 * @param event - API Gateway event with tradeId in path and auth token
 * @returns Success response or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const tradeId = event.pathParameters?.tradeId;
    if (!tradeId) return badRequest("tradeId is required");

    const currentUser = parseAuthToken(event.headers.Authorization);

    const trade = await getTrade(tradeId);
    if (!trade) return notFound("Trade not found");

    if (currentUser.playerId !== trade.fromPlayerId) {
      return error("You are not allowed to cancel this trade", 403);
    }

    await updateTradeStatus(tradeId, TradeStatus.REJECTED);

    return success({ message: "Trade cancelled" });
  } catch (err) {
    return handleError(err);
  }
};
