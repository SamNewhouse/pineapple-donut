export enum Tables {
  Items = "Items",
  Collectables = "Collectables",
  Players = "Players",
  Trades = "Trades",
  Rarities = "Rarities",
}

export interface Item {
  id: string;
  playerId: string;
  collectableId: string;
  quality: number;
  chance: number;
  foundAt: string;
}

export interface Collectable {
  id: string;
  name: string;
  description: string;
  rarity: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Rarity {
  id: number;
  name: string;
  minChance: number;
  maxChance: number;
  color: string;
}

export enum TradeStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface Trade {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredItemIds: string[];
  requestedItemIds: string[];
  status: TradeStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface Player {
  id: string;
  email: string;
  username: string;
  totalScans: number;
  createdAt: string;
  passwordHash: string;
}

export interface PlayerToken {
  playerId: string;
  email: string;
  iat: number;
  exp: number;
}
