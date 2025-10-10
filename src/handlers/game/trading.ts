import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, error, parseBody, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables } from "../../types";
import { parseAuthToken } from "../../core/auth";
import * as crypto from "crypto";

/**
 * Create a new trade offer between players
 */
export const createTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const { toPlayerId, offeredItemIds, requestedItemIds } = parseBody(event.body);

    if (!toPlayerId || !offeredItemIds || !requestedItemIds) {
      return badRequest("toPlayerId, offeredItemIds, and requestedItemIds required");
    }

    if (!Array.isArray(offeredItemIds) || !Array.isArray(requestedItemIds)) {
      return badRequest("offeredItemIds and requestedItemIds must be arrays");
    }

    // Verify player owns the offered items
    const offeredItems = await Promise.all(
      offeredItemIds.map((itemId) => Dynamodb.get(Tables.Items, { itemId })),
    );

    const invalidItems = offeredItems.filter(
      (item) => !item || item.playerId !== currentUser.playerId,
    );
    if (invalidItems.length > 0) {
      return badRequest("You can only trade items you own");
    }

    // Verify requested items belong to target player
    const requestedItems = await Promise.all(
      requestedItemIds.map((itemId) => Dynamodb.get(Tables.Items, { itemId })),
    );

    const invalidRequested = requestedItems.filter((item) => !item || item.playerId !== toPlayerId);
    if (invalidRequested.length > 0) {
      return badRequest("Requested items must belong to the target player");
    }

    const tradeId = crypto.randomUUID();
    const trade = {
      tradeId,
      fromPlayerId: currentUser.playerId,
      toPlayerId,
      offeredItemIds,
      requestedItemIds,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await Dynamodb.put(Tables.Trades, trade);

    return success(trade, 201, "Trade offer created successfully");
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Accept a trade offer
 */
export const acceptTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) {
      return badRequest("tradeId required");
    }

    const trade = await Dynamodb.get(Tables.Trades, { tradeId });

    if (!trade) {
      return notFound("Trade not found");
    }

    if (trade.toPlayerId !== currentUser.playerId) {
      return error("You can only accept trades offered to you", 403);
    }

    if (trade.status !== "pending") {
      return badRequest("Trade is no longer pending");
    }

    // Transfer items
    const updates = [];

    // Transfer offered items to accepting player
    for (const itemId of trade.offeredItemIds) {
      updates.push(
        Dynamodb.update(Tables.Items, { itemId }, "SET playerId = :newOwner", {
          ":newOwner": currentUser.playerId,
        }),
      );
    }

    // Transfer requested items to offering player
    for (const itemId of trade.requestedItemIds) {
      updates.push(
        Dynamodb.update(Tables.Items, { itemId }, "SET playerId = :newOwner", {
          ":newOwner": trade.fromPlayerId,
        }),
      );
    }

    // Update trade status
    updates.push(
      Dynamodb.update(
        Tables.Trades,
        { tradeId },
        "SET #status = :status, completedAt = :completedAt",
        {
          ":status": "completed",
          ":completedAt": new Date().toISOString(),
        },
      ),
    );

    await Promise.all(updates);

    return success({ message: "Trade completed successfully" });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Reject a trade offer
 */
export const rejectTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) {
      return badRequest("tradeId required");
    }

    const trade = await Dynamodb.get(Tables.Trades, { tradeId });

    if (!trade) {
      return notFound("Trade not found");
    }

    if (trade.toPlayerId !== currentUser.playerId) {
      return error("You can only reject trades offered to you", 403);
    }

    if (trade.status !== "pending") {
      return badRequest("Trade is no longer pending");
    }

    await Dynamodb.update(
      Tables.Trades,
      { tradeId },
      "SET #status = :status, rejectedAt = :rejectedAt",
      {
        ":status": "rejected",
        ":rejectedAt": new Date().toISOString(),
      },
    );

    return success({ message: "Trade rejected" });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Cancel a trade offer (by the creator)
 */
export const cancelTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const currentUser = parseAuthToken(event.headers.Authorization);
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) {
      return badRequest("tradeId required");
    }

    const trade = await Dynamodb.get(Tables.Trades, { tradeId });

    if (!trade) {
      return notFound("Trade not found");
    }

    if (trade.fromPlayerId !== currentUser.playerId) {
      return error("You can only cancel trades you created", 403);
    }

    if (trade.status !== "pending") {
      return badRequest("Trade is no longer pending");
    }

    await Dynamodb.update(
      Tables.Trades,
      { tradeId },
      "SET #status = :status, cancelledAt = :cancelledAt",
      {
        ":status": "cancelled",
        ":cancelledAt": new Date().toISOString(),
      },
    );

    return success({ message: "Trade cancelled" });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Get details of a specific trade
 */
export const getTrade: APIGatewayProxyHandler = async (event) => {
  try {
    const tradeId = event.pathParameters?.tradeId;

    if (!tradeId) {
      return badRequest("tradeId required");
    }

    const trade = await Dynamodb.get(Tables.Trades, { tradeId });

    if (!trade) {
      return notFound("Trade not found");
    }

    // Get details of all items involved in the trade
    const [offeredItems, requestedItems] = await Promise.all([
      Promise.all(
        trade.offeredItemIds.map((itemId: string) => Dynamodb.get(Tables.Items, { itemId })),
      ),
      Promise.all(
        trade.requestedItemIds.map((itemId: string) => Dynamodb.get(Tables.Items, { itemId })),
      ),
    ]);

    // Get player details for context
    const [fromPlayer, toPlayer] = await Promise.all([
      Dynamodb.get(Tables.Players, { playerId: trade.fromPlayerId }),
      Dynamodb.get(Tables.Players, { playerId: trade.toPlayerId }),
    ]);

    return success({
      ...trade,
      offeredItems: offeredItems.filter((item) => item), // Filter out null items
      requestedItems: requestedItems.filter((item) => item), // Filter out null items
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
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Get all trades for a player (both offered and received)
 */
export const getPlayerTrades: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;

    if (!playerId) {
      return badRequest("playerId required");
    }

    // Get trades where player is the sender
    const sentTrades = await Dynamodb.query(
      Tables.Trades,
      "fromPlayerId = :playerId",
      { ":playerId": playerId },
      "FromPlayerIndex",
    );

    // Get trades where player is the receiver
    const receivedTrades = await Dynamodb.query(
      Tables.Trades,
      "toPlayerId = :playerId",
      { ":playerId": playerId },
      "ToPlayerIndex",
    );

    return success({
      sentTrades,
      receivedTrades,
      totalTrades: sentTrades.length + receivedTrades.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
