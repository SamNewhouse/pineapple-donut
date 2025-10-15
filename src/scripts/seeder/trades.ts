import * as crypto from "crypto";
import { Player, Item, Trade, TradeStatus } from "../../types";

/**
 * Generate interconnected sample trades for development and testing.
 *
 * Features:
 * - Trades connect two distinct players (randomly chosen each time).
 * - Each trade is a bundle: 1-5 items offered + 1-5 items requested,
 *   randomly sized and selected. Items can appear in multiple trades.
 * - Item bundles are shuffled for diversity.
 * - Trade status is randomly assigned: ~40% completed, ~60% pending,
 *   with realistic timestamps (completed trades get an extra completedAt).
 * - Creation and completion dates simulate recent activity, spread over the last week.
 *
 * Use for populating your Trades table with realistic, interconnected test transactions:
 * perfect for admin UI development, trading logic, and seed scenario exploration.
 *
 * @param players    - Array of Player objects (the user pool for trade connections)
 * @param items      - Array of Item instances (already distributed/owned by players)
 * @param count      - Number of trades to generate
 * @returns Trade[]  - Array of fully-linked, randomly-bundled Trade records
 *
 * Notes:
 * - Items can appear in multiple trades, simulating real-world scenarios where
 *   players make overlapping offers/requests until one is accepted.
 * - In a live system, completed trades would invalidate other pending trades
 *   involving the same transferred items.
 * - Trade status and timestamps are randomized for more lifelike test data.
 * - Players with no items are skipped (using continue) to maintain trade generation.
 */
export function generateTrades(players: Player[], items: Item[], count: number): Trade[] {
  if (players.length < 2 || items.length < 2) return [];
  const trades: Trade[] = [];
  for (let i = 0; i < count; i++) {
    let fromIdx = Math.floor(Math.random() * players.length),
      toIdx;
    do {
      toIdx = Math.floor(Math.random() * players.length);
    } while (toIdx === fromIdx);

    const fromPlayerId = players[fromIdx].playerId,
      toPlayerId = players[toIdx].playerId;

    // Get all items owned by each player (can be re-used across trades)
    const fromsItems = items.filter((it) => it.playerId === fromPlayerId);
    const tosItems = items.filter((it) => it.playerId === toPlayerId);
    if (fromsItems.length === 0 || tosItems.length === 0) continue; // Skip if player has no items

    // Determine bundle sizes (1-5 items per side)
    const offeredNum = Math.max(1, Math.floor(Math.random() * 5) + 1);
    const requestedNum = Math.max(1, Math.floor(Math.random() * 5) + 1);
    // Shuffle and select items for this trade
    const offeredItemIds = fromsItems
      .sort(() => Math.random() - 0.5)
      .slice(0, offeredNum)
      .map((it) => it.itemId);
    const requestedItemIds = tosItems
      .sort(() => Math.random() - 0.5)
      .slice(0, requestedNum)
      .map((it) => it.itemId);

    // 40% chance for trade to be completed, otherwise pending
    const isCompleted = Math.random() < 0.4;
    trades.push({
      tradeId: crypto.randomUUID(),
      fromPlayerId,
      toPlayerId,
      offeredItemIds,
      requestedItemIds,
      status: isCompleted ? TradeStatus.COMPLETED : TradeStatus.PENDING,
      // Simulate creation time within the last week
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      // Completed trades get a completion timestamp
      ...(isCompleted
        ? {
            completedAt: new Date(
              Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }
        : {}),
    });
  }
  return trades;
}
