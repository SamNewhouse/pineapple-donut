import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, parseBody, handleError } from "../../lib/http";
import { createTrade } from "../../functions/trades";
import { parseAuthToken } from "../../functions/auth";

/**
 * Create a new trade offer between players.
 *
 * Flow:
 *  1. Parse and validate request parameters.
 *  2. Authenticate the requesting user.
 *  3. Create a pending trade record.
 *  4. Return the trade for client confirmation.
 *
 * @param event - API Gateway event with trade details in body and auth token in headers
 * @returns     - Success response with created trade object or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const { toPlayerId, offeredItemIds, requestedItemIds } = parseBody(event.body);

    if (!toPlayerId || !offeredItemIds || !requestedItemIds) {
      return badRequest("toPlayerId, offeredItemIds, and requestedItemIds are required");
    }
    if (!Array.isArray(offeredItemIds) || !Array.isArray(requestedItemIds)) {
      return badRequest("offeredItemIds and requestedItemIds must be arrays");
    }
    if (offeredItemIds.length === 0 && requestedItemIds.length === 0) {
      return badRequest("At least one side must offer at least one item");
    }
    if (toPlayerId === currentUser.playerId) {
      return badRequest("You cannot trade with yourself");
    }

    const trade = await createTrade({
      fromPlayerId: currentUser.playerId,
      toPlayerId,
      offeredItemIds,
      requestedItemIds,
    });

    return success(trade, 201, "Trade offer created successfully");
  } catch (err) {
    return handleError(err);
  }
};
