export enum Tables {
  Items = "Items",
  ItemCatalog = "ItemCatalog",
  Players = "Players",
  Sessions = "Sessions",
  Trades = "Trades",
}

export interface UserToken {
  playerId: string;
  email: string;
  username: string;
  iat: number;
  exp?: number;
}

export interface Trade {
  tradeId: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredItemIds: string[];
  requestedItemIds: string[];
  status: "pending" | "completed" | "rejected" | "cancelled";
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
}
