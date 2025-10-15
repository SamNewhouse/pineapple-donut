export enum Tables {
  Items = "Items",
  ItemCatalog = "ItemCatalog",
  Players = "Players",
  Trades = "Trades",
}

export interface Item {
  itemId: string;
  catalogItemId: string;
  playerId: string;
  foundAt: string;
}

export interface CatalogItem {
  itemId: string;
  name: string;
  description: string;
  rarity: string;
  rarityChance: number;
  rarityColor: string;
  imageUrl?: string;
  createdAt: string;
}

export interface PlayerToken {
  playerId: string;
  email: string;
  username: string;
  iat: number;
  exp?: number;
}

export enum TradeStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface Trade {
  tradeId: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredItemIds: string[];
  requestedItemIds: string[];
  status: TradeStatus;
  createdAt: string;
  completedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

export interface Player {
  playerId: string;
  email: string;
  username: string;
  totalScans: number;
  createdAt: string;
  token?: string;
  passwordHash?: string;
}
