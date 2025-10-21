# 🍩 Pineapple Donut

A serverless backend API for the Pineapple game ecosystem, built with AWS Lambda, DynamoDB, and the Serverless Framework. This API supports player authentication, item management, trading, and dynamic item rarity, with local and cloud deployment options.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- npm
- AWS CLI (configured)
- Docker (for local DynamoDB)
- Serverless CLI (`npm install -g serverless`)

### Installation

```bash
git clone https://github.com/SamNewhouse/pineapple-donut.git
cd pineapple-donut
npm install
```

Setup local environment variables (in `.env` or your shell):

```bash
cp .env.example .env
```

---

### 🚀 Local Development Workflow

Start or stop your local environment using the provided scripts:

```bash
npm run start
npm run stop
```

**What happens when you run the scripts?**

- `start.sh`:
  - Checks for required tools (cloudflared, Docker, npm) and your tunnel token file.
  - Starts local DynamoDB (if used), then launches the tunnel exposing your API securely.
  - Installs dependencies, formats code, cleans builds, compiles, and finally starts your backend server.
  - Prints friendly, readable progress with status messages in your terminal.

- `stop.sh`:
  - Gracefully shuts down local DynamoDB (if used).
  - Stops any running Cloudflared tunnel processes.
  - Provides status and guidance if manual steps are needed.

#### Available Scripts

- `npm run start` — Runs start.sh script (see above)
- `npm run stop` — Runs stop.sh script (see above)
- `npm run build` — Compile TypeScript sources
- `npm run deploy` — Deploy the project to AWS using Serverless
- `npm run offline` — Run Serverless Offline for local development
- `npm run dynamo:up` — Start local DynamoDB (Docker background)
- `npm run dynamo:down` — Stop local DynamoDB (data preserved)
- `npm run dynamo:destroy` — Remove local DynamoDB and delete data (clean volumes)
- `npm run dynamo:reset` — Destroy and restart DynamoDB (fresh instance)
- `npm run table:create` — Create DynamoDB tables (after DB is running)
- `npm run table:seed` — Seed database tables with example/sample data
- `npm run clean` — Remove build artifacts (cleanup)
- `npm run format` — Format codebase using Prettier

> See above for details on Cloudflare Tunnel integration and local API exposure!

---

## 📂 Project Structure -WIP

```
src
├── config/         # Environment variables and app settings
├── functions/      # Reusable logic modules (players, items, trades, collectables, auth)
├── handlers/       # Lambda API endpoints (each export handler for a route)
├── lib/            # Database and HTTP helpers
├── scripts/        # DB creation, seeding, and utility scripts
├── types/          # Shared TypeScript interfaces and enums
└── utils/          # Shared helper functions
```

---

## 📊 API Endpoints by Type -- Swagger TODO

#### **Authentication (`PlayerToken`)**

- `POST /auth/signup` — Register a new player account (returns JWT `PlayerToken`)
- `POST /auth/login` — Authenticate player and receive JWT `PlayerToken`

#### **Player (`Player`)**

- `GET /player/{id}` — Fetch player profile
- `POST /player/{id}/update/{field}` — Update a single editable field (authenticated only)
- `GET /player/{id}/items` — List all items owned by a player
- `GET /player/{id}/trades` — List all trades for a player

#### **Items (`Item`)**

- `GET /item/{itemId}` — Get details for a specific item

#### **Collectables (`Collectable`)**

- `GET /collectables` — List all collectable item definitions

#### **Rarities (`Rarity`)**

- `GET /rarities` — Get all rarity tiers and metadata

#### **Scan**

- `POST /scan/process` — Add newly scanned item to player inventory

#### **Trades (`Trade`)**

- `POST /trade/create` — Create a trade offer
- `GET /trade/{tradeId}` — Get trade details
- `POST /trade/{tradeId}/accept` — Accept a trade offer
- `POST /trade/{tradeId}/reject` — Reject a trade offer
- `POST /trade/{tradeId}/cancel` — Cancel a trade offer

---

## 📊 Database Schema

This project uses multiple DynamoDB tables for storing players, collectables, items, and trades. Below is an overview showing how each table maps to your TypeScript types and indexing strategy:

### Players Table

- **Table Name:** `Players`
- **Primary Key:** `id` (string)
- **Global Secondary Index:** `EmailIndex` (partition key: `email`)
  - Used for efficient lookup of players by email address.

**TypeScript Interface:**

```typescript
export interface Player {
  id: string;
  email: string;
  username: string;
  totalScans: number;
  createdAt: string;
  passwordHash: string;
}

// Used when generating a PlayerToken
export interface PlayerToken {
  playerId: string;
  email: string;
  iat: number;
  exp: number;
}
```

### Items Table

- **Table Name:** `Items`
- **Primary Key:** `id` (string)
- **Global Secondary Index:** `PlayerIndex` (partition key: `playerId`)
  - Enables lookup of all items owned by a specific player.

**TypeScript Interface:**

```typescript
export interface Item {
  id: string;
  playerId: string;
  collectableId: string;
  quality: number;
  chance: number;
  foundAt: string;
}
```

### Rarity Table

- **Table Name:** `Rarities`
- **Primary Key:** `id` (number)

**TypeScript Interface:**

```typescript
export interface Rarity {
  id: number;
  name: string;
  minChance: number;
  maxChance: number;
  color: string;
}
```

### Collectables Table

- **Table Name:** `Collectables`
- **Primary Key:** `id` (string)

**TypeScript Interface:**

```typescript
export interface Collectable {
  id: string;
  name: string;
  description: string;
  rarity: number;
  imageUrl?: string;
  createdAt: string;
}
```

### Trades Table

- **Table Name:** `Trades`
- **Primary Key:** `id` (string)
- **Global Secondary Indexes:**
  - `FromPlayerIndex`: partition key `fromPlayerId`
  - `ToPlayerIndex`: partition key `toPlayerId`
  - These GSIs let you efficiently find trades initiated or received by any player.

**TypeScript Interface:**

```typescript
export enum TradeStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface Trade {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredItemIds: string[];
  requestedItemIds: string[];
  status: TradeStatus;
  createdAt: string;
  resolvedAt?: string;
}
```

**All table names and key structures are consistent with the TypeScript types and the Serverless resources definitions in your project.**

---

### 🌐 Secure API Access with Cloudflare Tunnel

To allow the API (running locally or on a private server) to be accessible by remote clients and your frontend app, you can use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) to expose your service securely without opening your firewall or deploying to the cloud.

This is particularly useful during development and testing, or for accessing the API from a deployed tunnel-based version of your app.

#### **Setup Instructions**

1. **Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/)**

```bash
npm install -g cloudflared
```

2. **Authenticate and create a tunnel in your Cloudflare dashboard.**  
   Obtain your tunnel token and save it in a `~/.cloudflared/tunnel-token.txt` file in your home directory.

> The tunnel token can be generated via the Cloudflare dashboard or CLI.  
> You can read more in the [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).

3. **Run the tunnel, pointing to your local API server:**

The included `start.sh` script automatically loads your token from `~/.cloudflared/tunnel-token.txt` and exposes your local API (by default on `http://localhost:3000`) through Cloudflare’s network.  
The assigned public URL will appear in the Cloudflared logs (`~/.cloudflared/cloudflared.log`) once the tunnel is live.

4. **Update your frontend app or clients to use the generated public tunnel URL for API calls.**

> Make sure `~/.cloudflared/tunnel-token.txt` exists and contains your tunnel token.  
> **Never commit your tunnel token to source control or share it publicly.**  
> Keep the file secure in your home directory.

---

## 🌐 Deployment

Deploy to AWS:

```bash
npm run deploy
```

Deploy to a specific stage:

```bash
serverless deploy --stage production
```

---

## 🔒 Security

- JWT authentication for endpoints
- CORS enabled for APIs
- Configurable secrets via environment variables

---

## 🧪 Testing

- Coming soon.

---

## 👨‍💻 Author

### **Sam Newhouse**

I'm just bored

- Website: www.samnewhouse.co.uk
- GitHub: [@SamNewhouse](https://github.com/SamNewhouse)

---

## 🏗 Architecture \& Optimisation Plan

- **Current State:** All game data in DynamoDB, JWT client-side only, backend via Lambda
- **Hybrid Future:** Static meta in DynamoDB, transactional data (trades/inventory) in RDS/Aurora for scaling and analytics
- **Best Practice:** Static tokens, DRY types, modular structure
