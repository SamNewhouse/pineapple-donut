import { APIGatewayProxyHandler } from "aws-lambda";
import { getAchievementsByPlayer } from "../../functions/achievements";
import { success, handleError, badRequest } from "../../lib/http";
import { getPlayer } from "../../functions/players";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.id;
    if (!playerId) return badRequest("playerId required");

    const player = await getPlayer(playerId);
    if (!player || !player.achievements || player.achievements.length === 0) {
      return success({ achievements: [] });
    }

    const achievements = await getAchievementsByPlayer(player.achievements);
    return success({ achievements, total: achievements.length });
  } catch (error) {
    return handleError(error);
  }
};
