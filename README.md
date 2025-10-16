# 🍩 Pineapple Donut

A serverless backend API for the Pineapple game ecosystem, built with AWS Lambda, DynamoDB, and the Serverless Framework. This API supports player authentication, item management, trading, and dynamic item rarity, with local and cloud deployment options.

---

## 📂 Project Structure

```
src
├── config      # Configuration files for environment variables and app settings
├── core        # Core utilities: authentication, database, and HTTP helpers
├── data        # Static data definitions (e.g., rarity tiers)
├── handlers    # Lambda function endpoints (API logic for auth, game, trading)
├── scripts     # Database creation, seeding, and utility scripts
└── types       # Shared TypeScript type and interface definitions
```

---

## 🔧 Architecture

### Database Tables

- **Players**: User accounts and player profiles
- **ItemCatalog**: Master list of all available items
- **Items**: Player-owned item instances
- **Trades**: Trading transactions between players

Each table uses a primary key, plus various GSIs for query efficiency (see schema section below).

---

## 📊 API Endpoints

**Authentication:**

- `POST /auth/signup` — Create a new player account
- `POST /auth/login` — Authenticate player (JWT)
- `GET /player/{playerId}` — Fetch player profile

**Game Features:**

- `POST /scan/process` — Add scanned item to player inventory
- `GET /player/{playerId}/items` — List all items for a player
- `GET /item/{itemId}` — Get details for a specific item

**Trading System:**

- `POST /trade/create` — Create a trade offer
- `GET /trade/{tradeId}` — Get trade details
- `POST /trade/{tradeId}/accept` — Accept trade offer
- `POST /trade/{tradeId}/reject` — Reject trade offer
- `POST /trade/{tradeId}/cancel` — Cancel trade offer
- `GET /player/{playerId}/trades` — Get all trades for a player

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

### 🌐 Secure API Access with Cloudflare Tunnel

To allow the API (running locally or on a private server) to be accessible by remote clients and your frontend app, you can use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) to expose your service securely without opening your firewall or deploying to the cloud.

This is particularly useful during development and testing, or for accessing the API from a deployed tunnel-based version of your app.

#### Setup Instructions

1. **Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/)**

```bash
npm install -g cloudflared
# or
brew install cloudflare/cloudflare/cloudflared
```

2. **Authenticate and create a tunnel in your Cloudflare dashboard**, then obtain your tunnel token.
3. **Run the tunnel, pointing to the local API server:**

```bash
cloudflared tunnel run --token <YOUR_CLOUDFLARE_TUNNEL_TOKEN>
```

By default, this will expose your API running on `http://localhost:3000` to a public URL via Cloudflare's secure infrastructure.
4. **Update your frontend app or clients to use the generated public tunnel URL for API calls.**

> **Note:**
> Always keep your token secure. Only share tunnel URLs with trusted clients.

### Local Development

Start local DynamoDB:

```bash
npm run dynamo
```

Create database tables:

```bash
npm run table:create
```

Seed database with sample data (optional):

```bash
npm run table:seed
```

Start the dev server:

```bash
npm start  # API available at http://localhost:3000
```

#### Available Scripts

- `npm start` — Build and start Serverless Offline
- `npm run build` — Compile TypeScript
- `npm run deploy` — Deploy to AWS
- `npm run offline` — Run serverless offline
- `npm run dynamo` — Start local DynamoDB
- `npm run dynamo:reset` — Reset local DynamoDB
- `npm run table:create` — Create tables
- `npm run table:seed` — Seed tables
- `npm run clean` — Clean build artifacts

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

## 📊 Database Schema

### Players Table

- Primary Key: `playerId` (String)
- GSI: `EmailIndex` (for lookup by email)

### ItemCatalog Table

- Primary Key: `itemId` (String)

### Items Table

- Primary Key: `itemId` (String)
- GSI: `PlayerIndex` (for lookup by `playerId`)

### Trades Table

- Primary Key: `tradeId` (String)
- GSI: `FromPlayerIndex` (`fromPlayerId`)
- GSI: `ToPlayerIndex` (`toPlayerId`)

---

## 🧪 Testing

- Serverless Offline for API endpoint testing
- Docker Compose for local DynamoDB testing
- Postman/curl recommended for manual endpoint verification

---

## 👨‍💻 Author

**Sam Newhouse**

- Website: www.samnewhouse.co.uk
- GitHub: [@SamNewhouse](https://github.com/SamNewhouse)
