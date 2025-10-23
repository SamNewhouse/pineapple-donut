import { APIGatewayProxyHandler } from "aws-lambda";
import { getAchievementById } from "../../functions/achievements";
import { success, handleError, badRequest, notFound } from "../../lib/http";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id is required");

    const achievement = await getAchievementById(id);
    if (!achievement) return notFound("Achievement not found");

    return success(achievement);
  } catch (err) {
    return handleError(err);
  }
};
