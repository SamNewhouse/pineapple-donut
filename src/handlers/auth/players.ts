import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, handleError } from "../../core/http";
import * as Dynamodb from "../../core/dynamodb";
import { Tables, Player, PlayerToken } from "../../types";
import { parseAuthToken } from "../../core/auth";

/**
 * Get player profile information
 *
 * Retrieves player details with privacy controls based on authentication.
 * This endpoint supports both public profile viewing and private profile access:
 *
 * Public Access (no auth):
 * - Username and total scans only
 * - Useful for trading partner info and social features
 *
 * Private Access (viewing own profile):
 * - All profile data including email and creation date
 * - Full account management information
 *
 * Privacy Design:
 * - Email addresses are never exposed to other players
 * - Creation dates are private (prevents account age analysis)
 * - Total scans are public (gamification/social feature)
 * - Username is always public (required for trading/social features)
 *
 * @param event - API Gateway event with playerId in path and optional auth header
 * @returns Player profile data (scope depends on authentication) or error
 *
 * Use Cases:
 * - Player profile pages
 * - Trading partner information
 * - Social features and player discovery
 * - Account settings (when viewing own profile)
 */
export const getPlayer: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract player ID from URL path parameters
    const playerId = event.pathParameters?.playerId;

    // Validate required parameter
    if (!playerId) {
      return badRequest("playerId required");
    }

    // Fetch player data from database
    const player: Player | null = await Dynamodb.get(Tables.Players, { playerId });

    // Return 404 if player doesn't exist
    if (!player) {
      return notFound("Player not found");
    }

    // Determine if this is the player viewing their own profile
    // This controls what data is returned (privacy protection)
    let isOwnProfile = false;

    try {
      // Attempt to parse authentication token
      const currentPlayer: PlayerToken = parseAuthToken(event.headers.Authorization);
      isOwnProfile = currentPlayer.playerId === playerId;
    } catch {
      // Invalid or missing auth token - treat as public access
      isOwnProfile = false;
    }

    // Return different data sets based on access level
    if (isOwnProfile) {
      // Private profile view - include sensitive information
      // Used for account settings, profile management, etc.
      return success({
        id: player.id,
        username: player.username,
        email: player.email, // Only visible to owner
        totalScans: player.totalScans || 0,
        createdAt: player.createdAt, // Only visible to owner
      });
    } else {
      // Public profile view - limited information only
      // Used for social features, trading, player identification, etc.
      return success({
        id: player.id,
        username: player.username, // Public for social features
        totalScans: player.totalScans || 0, // Public for gamification
        // email and createdAt intentionally excluded for privacy
      });
    }
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Update player profile information
 *
 * Placeholder endpoint for future player profile editing functionality.
 * Will eventually allow players to modify their profile settings such as:
 * - Username changes (with uniqueness validation)
 * - Email updates (with verification)
 * - Privacy preferences
 * - Display settings
 * - Notification preferences
 *
 * Security Considerations (for future implementation):
 * - Authentication required
 * - Players can only update their own profiles
 * - Email changes require verification
 * - Username changes may have cooldown periods
 * - Sensitive operations require password confirmation
 *
 * @param event - API Gateway event with player updates and authentication
 * @returns Success message or validation errors
 *
 * Status: Not yet implemented
 */
export const updatePlayer: APIGatewayProxyHandler = async (event) => {
  try {
    // Placeholder response for future implementation
    // This endpoint is defined in serverless.yml but not yet built
    return success({ message: "Coming soon" });
  } catch (error) {
    return handleError(error);
  }
};
