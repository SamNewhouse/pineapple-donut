import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, error, parseBody, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Trade, TradeStatus } from "../../types";
import { parseAuthToken } from "../../core/auth";
import { randomUUID } from "crypto";

/**
 * Validate that all provided itemIds exist and are owned by the expected player.
 *
 * Used to ensure integrity of trade offers and to prevent unauthorized item use.
 *
 * @param itemIds           - Array of item IDs to validate
 * @param expectedPlayerId  - The expected owner/player ID for all these items
 * @returns Promise<boolean> - true if all items exist and ownership is correct
 */
async function validateItemOwnership(
  itemIds: string[],
  expectedPlayerId: string,
): Promise<boolean> {
  const items = await Promise.all(itemIds.map((itemId) => Dynamodb.get(Tables.Items, { itemId })));
  return items.every((item) => item && item.playerId === expectedPlayerId);
}

/**
 * After a successful trade, cancel any other pending trades that reference the items just transferred.
 *
 * This keeps the trades system clean and prevents "zombie" trades where the items are no longer available.
 *
 * @param completedTradeId - The ID of the trade just completed
 * @param movedItemIds     - The item IDs that changed ownership
 * @returns Promise<void>
 */
async function cancelConflictingTrades(completedTradeId: string, movedItemIds: string[]) {
  const allTrades = await Dynamodb.scan(Tables.Trades);
  const conflictingTrades = allTrades.filter(
    (trade) =>
      trade.tradeId !== completedTradeId &&
      trade.status === TradeStatus.PENDING &&
      (trade.offeredItemIds.some((id: string) => movedItemIds.includes(id)) ||
        trade.requestedItemIds.some((id: string) => movedItemIds.includes(id))),
  );
  await Promise.all(
    conflictingTrades.map((trade) =>
      Dynamodb.update(
        Tables.Trades,
        { tradeId: trade.tradeId },
        "SET status = :status, cancelledAt = :cancelledAt, cancelReason = :reason",
        {
          ":status": TradeStatus.CANCELLED,
          ":cancelledAt": new Date().toISOString(),
          ":reason": "Item(s) involved have already been traded",
        },
      ),
    ),
  );
}

/**
 * Create a new trade offer between players.
 *
 * Flow:
 * 1. Parse and validate request parameters.
 * 2. Authenticate the requesting user.
 * 3. Validate item ownership for both trade parties.
 * 4. Create a pending trade record.
 * 5. Return the trade for client confirmation.
 *
 * @param event - API Gateway event with trade details in body and auth token in headers
 * @returns Success response with created trade object or error
 */
export const createTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const { toPlayerId, offeredItemIds, requestedItemIds } = parseBody(event.body);

    if (!toPlayerId || !offeredItemIds || !requestedItemIds) {
      return badRequest("toPlayerId, offeredItemIds, and requestedItemIds are required");
    }
    if (!Array.isArray(offeredItemIds) || !Array.isArray(requestedItemIds)) {
      return badRequest("offeredItemIds and requestedItemIds must be arrays");
    }
    if (offeredItemIds.length === 0 || requestedItemIds.length === 0) {
      return badRequest("Both offered and requested items must contain at least one item");
    }
    if (toPlayerId === currentUser.playerId) {
      return badRequest("You cannot trade with yourself");
    }

    const [offeredValid, requestedValid] = await Promise.all([
      validateItemOwnership(offeredItemIds, currentUser.playerId),
      validateItemOwnership(requestedItemIds, toPlayerId),
    ]);

    if (!offeredValid) return badRequest("You can only trade items you own");
    if (!requestedValid) return badRequest("Requested items must belong to the target player");

    const trade: Trade = {
      tradeId: randomUUID(),
      fromPlayerId: currentUser.playerId,
      toPlayerId,
      offeredItemIds,
      requestedItemIds,
      status: TradeStatus.PENDING,
      createdAt: new Date().toISOString(),
    };

    await Dynamodb.put(Tables.Trades, trade);
    return success(trade, 201, "Trade offer created successfully");
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Accept a trade offer and atomically perform the item transfer.
 * Cancels any other pending trades that reference the transferred items.
 *
 * Flow:
 * 1. Parse and validate parameters.
 * 2. Authenticate accepting user.
 * 3. Verify pending status and ownership.
 * 4. Atomically swap item ownership and mark trade as completed.
 * 5. Cancel conflicting trades with the same items.
 * 6. Return confirmation.
 *
 * @param event - API Gateway event with tradeId in path and auth token
 * @returns Success response or error
 */
export const acceptTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) return badRequest("tradeId is required");
    const trade = await Dynamodb.get(Tables.Trades, { tradeId });
    if (!trade) return notFound("Trade not found");
    if (trade.toPlayerId !== currentUser.playerId) {
      return error("You can only accept trades offered to you", 403);
    }
    if (trade.status !== TradeStatus.PENDING) {
      return badRequest(`Trade is ${trade.status}, not pending`);
    }

    const [offeredValid, requestedValid] = await Promise.all([
      validateItemOwnership(trade.offeredItemIds, trade.fromPlayerId),
      validateItemOwnership(trade.requestedItemIds, trade.toPlayerId),
    ]);
    if (!offeredValid || !requestedValid) {
      return badRequest(
        "One or more items in this trade are no longer owned by the correct player. This trade cannot be completed.",
      );
    }

    const updates = [
      ...trade.offeredItemIds.map((itemId: string) =>
        Dynamodb.update(Tables.Items, { itemId }, "SET playerId = :newOwner", {
          ":newOwner": currentUser.playerId,
        }),
      ),
      ...trade.requestedItemIds.map((itemId: string) =>
        Dynamodb.update(Tables.Items, { itemId }, "SET playerId = :newOwner", {
          ":newOwner": trade.fromPlayerId,
        }),
      ),
      Dynamodb.update(
        Tables.Trades,
        { tradeId },
        "SET status = :status, completedAt = :completedAt",
        {
          ":status": TradeStatus.COMPLETED,
          ":completedAt": new Date().toISOString(),
        },
      ),
    ];
    await Promise.all(updates);

    const movedItemIds = [...trade.offeredItemIds, ...trade.requestedItemIds];
    await cancelConflictingTrades(tradeId, movedItemIds);

    return success({ message: "Trade completed successfully" });
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Reject a trade offer (by recipient).
 * Marks the trade as REJECTED. No items are moved.
 *
 * Validations:
 *  - Only trade recipient can reject
 *  - Trade must be pending
 *
 * @param event - API Gateway event with tradeId in path and auth token
 * @returns Success response or error
 */
export const rejectTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) return badRequest("tradeId is required");
    const trade = await Dynamodb.get(Tables.Trades, { tradeId });
    if (!trade) return notFound("Trade not found");
    if (trade.toPlayerId !== currentUser.playerId) {
      return error("You can only reject trades offered to you", 403);
    }
    if (trade.status !== TradeStatus.PENDING) {
      return badRequest(`Trade is ${trade.status}, not pending`);
    }
    await Dynamodb.update(
      Tables.Trades,
      { tradeId },
      "SET status = :status, rejectedAt = :rejectedAt",
      {
        ":status": TradeStatus.REJECTED,
        ":rejectedAt": new Date().toISOString(),
      },
    );
    return success({ message: "Trade rejected" });
  } catch (err) {
    return handleError(err);
  }
};

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
export const cancelTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) return badRequest("tradeId is required");
    const trade = await Dynamodb.get(Tables.Trades, { tradeId });
    if (!trade) return notFound("Trade not found");
    if (trade.fromPlayerId !== currentUser.playerId) {
      return error("You can only cancel trades you created", 403);
    }
    if (trade.status !== TradeStatus.PENDING) {
      return badRequest(`Trade is ${trade.status}, not pending`);
    }
    await Dynamodb.update(
      Tables.Trades,
      { tradeId },
      "SET status = :status, cancelledAt = :cancelledAt",
      {
        ":status": TradeStatus.CANCELLED,
        ":cancelledAt": new Date().toISOString(),
      },
    );
    return success({ message: "Trade cancelled" });
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Fetch details of a specific trade, including:
 * - Trade record
 * - Full item data for offered/requested bundles
 * - Player usernames (for display only)
 *
 * @param event - API Gateway event with tradeId in path
 * @returns Success response with enriched trade data or error
 */
export const getTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) return badRequest("tradeId is required");
    const trade = await Dynamodb.get(Tables.Trades, { tradeId });
    if (!trade) return notFound("Trade not found");

    const [offeredItems, requestedItems, fromPlayer, toPlayer] = await Promise.all([
      Promise.all(
        trade.offeredItemIds.map((itemId: string) => Dynamodb.get(Tables.Items, { itemId })),
      ),
      Promise.all(
        trade.requestedItemIds.map((itemId: string) => Dynamodb.get(Tables.Items, { itemId })),
      ),
      Dynamodb.get(Tables.Players, { playerId: trade.fromPlayerId }),
      Dynamodb.get(Tables.Players, { playerId: trade.toPlayerId }),
    ]);

    return success({
      ...trade,
      offeredItems: offeredItems.filter(Boolean),
      requestedItems: requestedItems.filter(Boolean),
      fromPlayer: fromPlayer
        ? {
            playerId: fromPlayer.playerId,
            username: fromPlayer.username,
          }
        : null,
      toPlayer: toPlayer
        ? {
            playerId: toPlayer.playerId,
            username: toPlayer.username,
          }
        : null,
    });
  } catch (err) {
    return handleError(err);
  }
};

/**
 * List all trades involving a player (sent or received).
 *
 * Returns trades sent by this player and received by this player, for dashboards or history.
 *
 * @param event - API Gateway event with playerId in path
 * @returns Success response with trade lists and summary count or error
 */
export const getPlayerTrades: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;
    if (!playerId) return badRequest("playerId is required");

    const [sentTrades, receivedTrades] = await Promise.all([
      Dynamodb.query(
        Tables.Trades,
        "fromPlayerId = :playerId",
        { ":playerId": playerId },
        "FromPlayerIndex",
      ),
      Dynamodb.query(
        Tables.Trades,
        "toPlayerId = :playerId",
        { ":playerId": playerId },
        "ToPlayerIndex",
      ),
    ]);

    return success({
      sentTrades,
      receivedTrades,
      totalTrades: sentTrades.length + receivedTrades.length,
    });
  } catch (err) {
    return handleError(err);
  }
};
