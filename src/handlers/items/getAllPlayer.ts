import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, handleError } from "../../lib/http";
import { getItemsByPlayer } from "../../functions/items";

export const getAll: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;
    if (!playerId) {
      return badRequest("playerId required");
    }

    const playerItems = await getItemsByPlayer(playerId);

    return success({
      items: playerItems.map((item) => ({
        id: item.id,
        collectableId: item.collectableId,
        foundAt: item.foundAt,
        quality: item.quality,
        chance: item.chance,
      })),
      total: playerItems.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
