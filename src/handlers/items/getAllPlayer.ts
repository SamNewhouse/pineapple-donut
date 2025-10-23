import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, handleError } from "../../lib/http";
import { getItemsByPlayer } from "../../functions/items";
import { Item } from "../../types";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return badRequest("id required");
    }

    const playerItems = await getItemsByPlayer(id);

    return success({
      items: playerItems.map((item: Item) => ({
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
