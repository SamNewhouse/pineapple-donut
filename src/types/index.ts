export enum Tables {
  Items = "Items",
  Collectables = "Collectables",
  Players = "Players",
  Trades = "Trades",
}

export interface Item {
  id: string;
  collectableId: string;
  playerId: string;
  foundAt: string;
}

export interface Collectable {
  id: string;
  name: string;
  description: string;
  rarity: string;
  rarityChance: number;
  rarityColor: string;
  imageUrl?: string;
  createdAt: string;
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
  completedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

export interface Player {
  id: string;
  email: string;
  username: string;
  totalScans: number;
  createdAt: string;
  token?: string;
  passwordHash?: string;
}

export interface PlayerToken {
  playerId: string;
  email: string;
  username: string;
  iat: number;
  exp?: number;
}

export interface AwardedItem extends Collectable {
  collectableId?: string;
  rarityMinChance?: number;
  rarityMaxChance?: number;
}

export interface ScanResult {
  awardedItem?: AwardedItem;
  playerId?: string;
  foundAt?: string;
  error?: any;
}
