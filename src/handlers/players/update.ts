import { APIGatewayProxyHandler } from "aws-lambda";
import { parseBody, success, badRequest, handleError, unauthorized } from "../../lib/http";
import { parseAuthToken, sanitizePlayer } from "../../functions/auth";
import { updatePlayerField } from "../../functions/players";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const playerId = event.pathParameters?.id;
    const field = event.pathParameters?.field;
    if (!playerId || !field) return badRequest("Player ID and field are required");

    let token;
    try {
      token = parseAuthToken(event.headers.Authorization);
    } catch {
      return unauthorized("Authentication required");
    }
    if (token.playerId !== playerId) return unauthorized("You can only update your own profile");

    const { value } = parseBody(event.body);
    if (typeof value === "undefined") return badRequest("No value provided");

    const updatedPlayer = await updatePlayerField(playerId, field, value);

    return success({ ...sanitizePlayer(updatedPlayer) }, 200, "Profile updated");
  } catch (error) {
    if (error instanceof Error && error.message.endsWith("in use"))
      return badRequest(error.message);
    if (error instanceof Error && error.message === "Player not found")
      return badRequest(error.message);
    return handleError(error);
  }
};
