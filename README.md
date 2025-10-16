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

---

#### **Setup Instructions**

1. **Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/)**
   `npm install -g cloudflared`

2. **Authenticate and create a tunnel in your Cloudflare dashboard.**  
   Obtain your tunnel token and save it in a `~/.cloudflared/tunnel-token.txt` file in your home directory.

> **Tip:**  
> The tunnel token can be generated via the Cloudflare dashboard or CLI.  
> You can read more in the [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).

3. **Run the tunnel, pointing to your local API server:**

The included `start.sh` script automatically loads your token from `~/.cloudflared/tunnel-token.txt` and exposes your local API (by default on `http://localhost:3000`) through Cloudflare’s network.  
The assigned public URL will appear in the Cloudflared logs (`~/.cloudflared/cloudflared.log`) once the tunnel is live.

4. **Update your frontend app or clients to use the generated public tunnel URL for API calls.**

> **Note:**  
> Make sure `~/.cloudflared/tunnel-token.txt` exists and contains your tunnel token.  
> **Never commit your tunnel token to source control or share it publicly.**  
> Keep the file secure in your home directory.

---

### 🚀 Local Development Workflow

Start or stop your local environment using the provided scripts:

```bash
chmod +x start.sh stop.sh   # Give the executable files the right permissions
./start.sh                  # Starts DynamoDB (if used locally), Cloudflare tunnel, and your backend API
./stop.sh                   # Stops the Cloudflare tunnel and shuts down DynamoDB
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

- `npm run start` — Build and start Serverless Offline (local API)
- `npm run build` — Compile TypeScript sources
- `npm run deploy` — Deploy the project to AWS using Serverless
- `npm run offline` — Run Serverless Offline for local development
- `npm run dynamo:up` — **Start local DynamoDB** (Docker background)
- `npm run dynamo:down` — **Stop local DynamoDB** (data preserved)
- `npm run dynamo:destroy` — **Remove local DynamoDB and delete data** (clean volumes)
- `npm run dynamo:reset` — **Destroy and restart DynamoDB** (fresh instance)
- `npm run table:create` — Create DynamoDB tables (after DB is running)
- `npm run table:seed` — Seed database tables with example/sample data
- `npm run clean` — Remove build artifacts (cleanup)
- `npm run format` — Format codebase using Prettier

> See above for details on Cloudflare Tunnel integration and local API exposure!

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
