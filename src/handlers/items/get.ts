import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, handleError } from "../../lib/http";
import { getItemById } from "../../functions/items";

export const getItem: APIGatewayProxyHandler = async (event) => {
  try {
    const itemId = event.pathParameters?.itemId;

    if (!itemId) {
      return badRequest("itemId required");
    }

    const item = await getItemById(itemId);

    if (!item) {
      return notFound("Item not found");
    }

    return success(item, 200, "Item retrieved successfully");
  } catch (error) {
    return handleError(error);
  }
};
