import { APIGatewayProxyHandler } from "aws-lambda";
import { badRequest, notFound, success, handleError } from "../../lib/http";
import { getTradeWithDetails } from "../../functions/trades";

/**
 * Fetch details of a specific trade, including:
 * - Trade record
 * - Full item data for offered/requested bundles
 * - Player usernames (for display only)
 *
 * @param event - API Gateway event with id in path
 * @returns     - Success response with enriched trade data or error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id is required");

    const trade = await getTradeWithDetails(id);
    if (!trade) return notFound("Trade not found");

    return success(trade);
  } catch (err) {
    return handleError(err);
  }
};
