import { APIGatewayProxyHandler } from "aws-lambda";
import { success, handleError } from "../../lib/http";
import { getAllTrades } from "../../functions/trades";
import { Trade } from "../../types";

export const handler: APIGatewayProxyHandler = async (_event) => {
  try {
    const trades: Trade[] = await getAllTrades();

    return success({
      trades,
      total: trades.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
