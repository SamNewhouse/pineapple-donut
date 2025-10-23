import { APIGatewayProxyHandler } from "aws-lambda";
import { badRequest, error, handleError, notFound, success } from "../../lib/http";
import { parseAuthToken } from "../../functions/auth";
import { getTrade, updateTradeStatus } from "../../functions/trades";
import { TradeStatus } from "../../types";

/**
 * Reject a trade offer (by recipient).
 * Marks the trade as REJECTED.
 *
 * Validations:
 *  - Only the recipient may reject
 *  - Trade must be pending
 *
 * @param event - API Gateway event with id in path and auth token
 * @returns     - Success response or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id is required");

    const currentPlayer = parseAuthToken(event.headers.Authorization);

    const trade = await getTrade(id);
    if (!trade) return notFound("Trade not found");

    if (currentPlayer.playerId !== trade.toPlayerId) {
      return error("You are not allowed to reject this trade", 403);
    }
    if (trade.status !== TradeStatus.PENDING) {
      return badRequest(`Trade is ${trade.status}, not pending`);
    }

    await updateTradeStatus(id, TradeStatus.REJECTED);

    return success({ message: "Trade rejected" });
  } catch (err) {
    return handleError(err);
  }
};
