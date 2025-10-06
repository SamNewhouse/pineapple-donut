import { APIGatewayProxyHandler } from "aws-lambda";

export const getItemInfo: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Lookup item details by barcode/QR code
    return {
      statusCode: 200,
      body: JSON.stringify({
        item: {
          barcode: "demo-barcode",
          name: "Collectible Card",
          rarity: "rare",
          value: 50,
          description: "A rare collectible trading card",
        },
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

export const getAllItems: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: Get all available items in the game
    return {
      statusCode: 200,
      body: JSON.stringify({
        items: [
          { itemId: "item1", name: "Common Sticker", rarity: "common", value: 5 },
          { itemId: "item2", name: "Rare Card", rarity: "rare", value: 50 },
          { itemId: "item3", name: "Epic Token", rarity: "epic", value: 200 },
        ],
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

// Mock data: define collections and items.
// In a real app, replace these with DB queries or configs.
const COLLECTIONS = [
  {
    collectionId: "retro-cards",
    name: "Retro Cards",
    description: "Collect all 5 1990s retro trading cards!",
    items: [
      { itemId: "card-1", name: "Dino", rarity: "common" },
      { itemId: "card-2", name: "Space Kid", rarity: "uncommon" },
      { itemId: "card-3", name: "Blaster", rarity: "common" },
      { itemId: "card-4", name: "Infinity Ape", rarity: "rare" },
      { itemId: "card-5", name: "Neon Shark", rarity: "rare" },
    ],
  },
  {
    collectionId: "founder-badges",
    name: "Founders Set",
    description: "Collect the original limited Founder’s Items!",
    items: [
      { itemId: "badge-1", name: "Founder's Medallion", rarity: "legendary" },
      { itemId: "pin-1", name: "OG Pin", rarity: "rare" },
    ],
  },
];

// Helper for mock player progress (replace with real DB!)
function getMockPlayerCollectionState(playerId: string) {
  return [
    {
      collectionId: "retro-cards",
      completed: false,
      itemsCollected: ["card-1", "card-2"],
      missingItems: ["card-3", "card-4", "card-5"],
      rewardClaimed: false,
    },
    {
      collectionId: "founder-badges",
      completed: true,
      itemsCollected: ["badge-1", "pin-1"],
      missingItems: [],
      rewardClaimed: true,
    },
  ];
}

// 1. List all collections
export const getAllCollections: APIGatewayProxyHandler = async () => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({ collections: COLLECTIONS }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) errorMessage = error.message;
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};

// 2. Get a player's collection progress
export const getPlayerCollections: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract playerId, e.g., from /player/{playerId}/collections endpoint
    const playerId = event.pathParameters?.playerId || "demo-player";
    // Replace with DB logic for real projects!
    const collectionsProgress = getMockPlayerCollectionState(playerId);
    return {
      statusCode: 200,
      body: JSON.stringify({ collectionsProgress }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) errorMessage = error.message;
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};

// 3. Claim a collection reward for a player
export const claimCollectionReward: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract identifiers from the path (expecting /player/{playerId}/collections/{collectionId}/claim)
    const playerId = event.pathParameters?.playerId || "demo-player";
    const collectionId = event.pathParameters?.collectionId || "demo-collection";
    // Normally would check the DB if the player actually completed the collection
    // For demo, mock claim
    return {
      statusCode: 200,
      body: JSON.stringify({
        collectionId,
        reward: { type: "badge", name: "Collection Master" },
        success: true,
        message: `Congrats! You've completed and claimed the reward for ${collectionId}!`,
      }),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) errorMessage = error.message;
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
