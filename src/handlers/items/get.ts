import { APIGatewayProxyHandler } from "aws-lambda";
import { success, badRequest, notFound, handleError } from "../../lib/http";
import { getItemById } from "../../functions/items";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return badRequest("id required");
    }

    const item = await getItemById(id);

    if (!item) {
      return notFound("Item not found");
    }

    return success(item, 200, "Item retrieved successfully");
  } catch (error) {
    return handleError(error);
  }
};
