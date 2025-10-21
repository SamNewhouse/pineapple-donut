import { Item, Tables, Trade, TradeStatus } from "../types";
import * as Dynamodb from "../lib/dynamodb";

/**
 * Retrieve a single trade by its unique identifier.
 *
 * @param tradeId - The primary key of the trade to retrieve.
 * @returns       - The Trade object if found, or null if missing.
 */
export async function getTrade(tradeId: string): Promise<Trade | null> {
  return Dynamodb.get(Tables.Trades, { id: tradeId });
}

/**
 * Fetch all trades where the player is either sender or recipient.
 *
 * @param playerId - The player's unique identifier.
 * @returns        - An object with arrays of sent and received trades.
 */
export async function getPlayerTrades(playerId: string): Promise<{
  sentTrades: Trade[];
  receivedTrades: Trade[];
}> {
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
  return { sentTrades, receivedTrades };
}

/**
 * Fetches all details for a trade in a single call:
 * - Trade itself (by ID)
 * - Offered/requested items (full records)
 * - From/to players (username + id)
 */
export async function getTradeWithDetails(tradeId: string): Promise<any | null> {
  const trade = await getTrade(tradeId);
  if (!trade) return null;

  const [offeredItems, requestedItems, fromPlayer, toPlayer] = await Promise.all([
    Promise.all(
      trade.offeredItemIds.map((itemId: string) => Dynamodb.get(Tables.Items, { id: itemId })),
    ),
    Promise.all(
      trade.requestedItemIds.map((itemId: string) => Dynamodb.get(Tables.Items, { id: itemId })),
    ),
    Dynamodb.get(Tables.Players, { id: trade.fromPlayerId }),
    Dynamodb.get(Tables.Players, { id: trade.toPlayerId }),
  ]);

  return {
    ...trade,
    offeredItems: offeredItems.filter(Boolean),
    requestedItems: requestedItems.filter(Boolean),
    fromPlayer: fromPlayer ? { playerId: fromPlayer.id, username: fromPlayer.username } : null,
    toPlayer: toPlayer ? { playerId: toPlayer.id, username: toPlayer.username } : null,
  };
}

/**
 * Create a new trade as PENDING between two players.
 *
 * @param trade - Object describing trade parameters.
 * @returns     - The created Trade object.
 */
export async function createTrade(trade: {
  fromPlayerId: string;
  toPlayerId: string;
  offeredItemIds: string[];
  requestedItemIds: string[];
}): Promise<Trade> {
  const newTrade: Trade = {
    id: crypto.randomUUID(),
    ...trade,
    status: TradeStatus.PENDING,
    createdAt: new Date().toISOString(),
  };
  await Dynamodb.put(Tables.Trades, newTrade);
  return newTrade;
}

/**
 * Update a trade's status and set its resolvedAt timestamp.
 *
 * Use this for terminal state transitions—COMPLETED, CANCELLED, REJECTED, etc.
 *
 * @param tradeId - The unique trade identifier to update.
 * @param status  - The new status for the trade.
 * @returns       - The updated Trade object or null if not found.
 */
export async function updateTradeStatus(
  tradeId: string,
  status: TradeStatus,
): Promise<Trade | null> {
  return Dynamodb.update(
    Tables.Trades,
    { id: tradeId },
    "SET #status = :status, resolvedAt = :resolvedAt",
    {
      ":status": status,
      ":resolvedAt": new Date().toISOString(),
    },
    { "#status": "status" },
  );
}

/**
 * Returns true if the provided trade is in the PENDING status.
 *
 * @param trade - A Trade object.
 * @returns     - True if pending; otherwise, false.
 */
export function isPendingTrade(trade: Trade): boolean {
  return trade?.status === TradeStatus.PENDING;
}

/**
 * Convenience function to cancel a trade by its ID.
 *
 * @param tradeId - The trade to cancel.
 * @returns       - The cancelled Trade object or null if not found.
 */
export async function cancelTrade(tradeId: string): Promise<Trade | null> {
  return updateTradeStatus(tradeId, TradeStatus.CANCELLED);
}

/**
 * Confirm all provided items exist and are currently owned by the target player.
 *
 * This is required for validating offered/requested items in a trade.
 *
 * @param itemIds           - Array of item IDs to verify.
 * @param expectedPlayerId  - The playerId who should currently own all items.
 * @returns                 - True if all items exist and playerId is correct, else false.
 */
export async function itemsBelongToPlayer(
  itemIds: string[],
  expectedPlayerId: string,
): Promise<boolean> {
  if (!itemIds.length) return true;
  const items: Item[] = await Promise.all(
    itemIds.map((itemId) => Dynamodb.get(Tables.Items, { id: itemId })),
  );
  return items.every((item) => !!item && item.playerId === expectedPlayerId);
}

/**
 * Find all other pending trades that reference any of the specified item IDs.
 * Used for cancelling "conflicting" trades when a trade is accepted.
 *
 * @param excludeTradeId - The current trade (to exclude from results).
 * @param itemIds        - Array of item IDs just transferred.
 * @returns              - Array of conflicting Trade objects.
 *
 * NOTE: If your number of trades grows, consider adding a GSI for item/ownership.
 */
export async function findConflictingTrades(
  excludeTradeId: string,
  itemIds: string[],
): Promise<Trade[]> {
  const allTrades: Trade[] = await Dynamodb.scan(Tables.Trades);
  return allTrades.filter(
    (t) =>
      t.id !== excludeTradeId &&
      t.status === TradeStatus.PENDING &&
      ((t.offeredItemIds && t.offeredItemIds.some((iid: string) => itemIds.includes(iid))) ||
        (t.requestedItemIds && t.requestedItemIds.some((iid: string) => itemIds.includes(iid)))),
  );
}

/**
 * Transfer all listed items to a new owner (playerId).
 *
 * @param itemIds    - The IDs of all items to transfer.
 * @param toPlayerId - The playerId of the recipient.
 * @returns          - An array of updated Item objects.
 */
export async function transferItemOwnership(
  itemIds: string[],
  toPlayerId: string,
): Promise<Item[]> {
  return Promise.all(
    itemIds.map((itemId) =>
      Dynamodb.update(Tables.Items, { id: itemId }, "SET playerId = :newOwner", {
        ":newOwner": toPlayerId,
      }),
    ),
  );
}
