// src/handlers/players/manager.ts
import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables } from "../../types";
import { parseAuthToken } from "../../core/auth";

/**
 * Get player profile information
 * Returns full profile for own account, limited info for others
 */
export const getPlayer: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;

    if (!playerId) {
      return badRequest("playerId required");
    }

    const player = await Dynamodb.get(Tables.Players, { playerId });

    if (!player) {
      return notFound("Player not found");
    }

    // Check if this is the user's own profile
    let isOwnProfile = false;

    try {
      const currentUser = parseAuthToken(event.headers.Authorization);
      isOwnProfile = currentUser.playerId === playerId;
    } catch {
      // No valid token = viewing as guest/other user
      isOwnProfile = false;
    }

    if (isOwnProfile) {
      // Full profile for own account
      return success({
        playerId: player.playerId,
        username: player.username,
        email: player.email,
        totalScans: player.totalScans || 0,
        score: player.score || 0,
        createdAt: player.createdAt,
      });
    } else {
      // Limited public profile for others
      return success({
        playerId: player.playerId,
        username: player.username,
        totalScans: player.totalScans || 0,
        // TODO: Add items collected count when inventory is implemented
      });
    }
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Update player profile information
 */
export const updatePlayer: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Implement player profile updates (username, etc.)
    // Will need JWT verification to ensure user can only update their own profile
    return success({ message: "Coming soon" });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Get player leaderboard ranking
 */
export const getPlayerRanking: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Implement leaderboard functionality
    return success({ message: "Coming soon" });
  } catch (error) {
    return handleError(error);
  }
};
