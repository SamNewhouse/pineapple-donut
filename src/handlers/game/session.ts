import { APIGatewayProxyHandler } from "aws-lambda";

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Create new game session, generate sessionId/token
    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: "demo-session-id", token: "demo-token" }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Fetch session state by sessionId in event.pathParameters
    return {
      statusCode: 200,
      body: JSON.stringify({ session: "demo-session-details" }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
