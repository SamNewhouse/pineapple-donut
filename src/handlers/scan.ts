import { APIGatewayProxyHandler } from "aws-lambda";

export const process: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Validate scan, add item to inventory, award points
    return {
      statusCode: 200,
      body: JSON.stringify({
        result: "scan successful",
        item: { name: "Demo Item", rarity: "common", value: 10 },
        points: 10,
      }),
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

export const validate: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Validate scan authenticity/format, check if already scanned by player
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true, alreadyScanned: false }),
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
