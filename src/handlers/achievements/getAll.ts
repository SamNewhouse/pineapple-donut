import { APIGatewayProxyHandler } from "aws-lambda";
import { getAllAchievements } from "../../functions/achievements";
import { success, handleError } from "../../lib/http";

export const handler: APIGatewayProxyHandler = async (_event) => {
  try {
    const achievements = await getAllAchievements();
    return success({ achievements, total: achievements.length });
  } catch (error) {
    return handleError(error);
  }
};
