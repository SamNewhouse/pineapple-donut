import { APIGatewayProxyHandler } from "aws-lambda";
import { success, handleError } from "../../lib/http";
import { getAllItems } from "../../functions/items";
import { Item } from "../../types";

export const handler: APIGatewayProxyHandler = async (_event) => {
  try {
    const items: Item[] = await getAllItems();

    return success({
      items,
      total: items.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
