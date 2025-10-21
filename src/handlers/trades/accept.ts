import { APIGatewayProxyHandler } from "aws-lambda";
import { parseAuthToken } from "../../functions/auth";
import { badRequest, notFound, success, error, handleError } from "../../lib/http";
import { TradeStatus } from "../../types";
import {
  findConflictingTrades,
  getTrade,
  itemsBelongToPlayer,
  transferItemOwnership,
  updateTradeStatus,
} from "../../functions/trades";

/**
 * Accept a trade offer, performing atomic item transfer and cancelling all other pending trades involving same items.
 *
 * 1. Parse parameters and authenticate user.
 * 2. Validate trade exists, is pending, and is addressed to user.
 * 3. Ensure ownership of all traded items.
 * 4. Swap item ownership between sender and recipient.
 * 5. Mark the trade as completed (with resolvedAt timestamp).
 * 6. Cancel all other pending trades involving these items.
 * 7. Return confirmation.
 *
 * @param event - API Gateway event with tradeId in path and JWT auth
 * @returns     - Success response or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const tradeId = event.pathParameters?.tradeId;
    if (!tradeId) return badRequest("tradeId is required");

    // 1. Load and validate the trade
    const trade = await getTrade(tradeId);
    if (!trade) return notFound("Trade not found");
    if (trade.toPlayerId !== currentUser.playerId) {
      return error("You can only accept trades offered to you", 403);
    }
    if (trade.status !== TradeStatus.PENDING) {
      return badRequest(`Trade is ${trade.status}, not pending`);
    }

    // 2. Ensure ownership of all traded items
    if (!(await itemsBelongToPlayer(trade.offeredItemIds, trade.fromPlayerId))) {
      return badRequest("Offered items are no longer owned by the sender.");
    }
    if (!(await itemsBelongToPlayer(trade.requestedItemIds, trade.toPlayerId))) {
      return badRequest("Requested items are no longer owned by you.");
    }

    // 3. Swap item ownership in parallel
    await Promise.all([
      transferItemOwnership(trade.offeredItemIds, currentUser.playerId),
      transferItemOwnership(trade.requestedItemIds, trade.fromPlayerId),
      updateTradeStatus(tradeId, TradeStatus.COMPLETED),
    ]);

    // 4. Cancel all other pending trades involving these items
    const movedItemIds = [...trade.offeredItemIds, ...trade.requestedItemIds];
    if (movedItemIds.length > 0) {
      const conflicts = await findConflictingTrades(tradeId, movedItemIds);
      await Promise.all(
        conflicts.map((conflict) => updateTradeStatus(conflict.id, TradeStatus.CANCELLED)),
      );
    }

    return success({ message: "Trade completed successfully" });
  } catch (err) {
    return handleError(err);
  }
};
