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

## 📊 API Endpoints

**Authentication:**

- `POST /auth/signup` — Create a new player account
- `POST /auth/login` — Authenticate player (JWT)
- `GET /player/{id}` — Fetch player profile

**Game Features:**

- `POST /scan/process` — Add scanned item to player inventory
- `GET /player/{id}/items` — List all items for a player
- `GET /item/{itemId}` — Get details for a specific item

**Trading System:**

- `POST /trade/create` — Create a trade offer
- `GET /trade/{tradeId}` — Get trade details
- `POST /trade/{tradeId}/accept` — Accept trade offer
- `POST /trade/{tradeId}/reject` — Reject trade offer
- `POST /trade/{tradeId}/cancel` — Cancel trade offer
- `GET /player/{id}/trades` — Get all trades for a player

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
  token?: string;
  passwordHash?: string;
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
  collectableId: string;
  playerId: string;
  foundAt: string;
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
  rarity: string;
  rarityChance: number;
  rarityColor: string;
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
  completedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
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

- Serverless Offline for API endpoint testing
- Docker Compose for local DynamoDB testing
- Postman/curl recommended for manual endpoint verification

---

## 👨‍💻 Author

### **Sam Newhouse**

I'm just bored

- Website: www.samnewhouse.co.uk
- GitHub: [@SamNewhouse](https://github.com/SamNewhouse)

---

# Pineapple Donut Backend Architecture: Optimisation Plan (2025)

## Overview

**Pineapple Donut** is a serverless game backend using AWS Lambda and DynamoDB, serving player authentication, item management, trading, and dynamic metadata. The new architecture introduces RDS/Aurora for transactional and relational functions, optimizing cost, scalability, and analytics.

---

## Current State

- **All Data in DynamoDB**: Players, Items, Collectables, and Trades stored in DynamoDB tables.
- **Session Tokens**: Managed locally by apps; no volatile session state stored in DB.
- **Reads**: Client accesses table data frequently; player fetches on login, items/collectables loaded per session.

---

## Proposed Hybrid Architecture

### **DynamoDB** (For Stable, Lookup-Oriented & Static Data)

- **Players Table**: Stores basic profile (id, email, username, totalScans, createdAt).
  - Rarely updated, fast key lookups.
- **Collectables Table**: Static metadata for items (rarely changes).
  - Loaded on player login, cached locally on client.
- **Achievements Table**: Future addition; mostly infrequent lookups and updates.
  - Also cached locally, notification system for changes.

### **RDS/Aurora** (For Transactional, Relational, and Consistency-Critical Data)

- **Players Table**: Sensitive info, profile relations, advanced analytics.
- **Items Table**: Ownership cross-linked by player and collectable, strong consistency for trades.
- **Trades Table**: Atomic trade execution, multi-entity updates, rollbacks.
  - SQL joins for player/inventory/audit analytics.
- **Inventory Audits, Reports, and Growth Projections**: Advanced BI queries.

---

## Table Designs (Example Schemas)

### DynamoDB

```typescript
interface Players {
  id: string;
  email: string;
  username: string;
  totalScans: number;
  createdAt: string;
}

interface Collectables {
  id: string;
  name: string;
  description: string;
  rarity: string;
  rarityChance: number;
  rarityColor: string;
  imageUrl?: string;
  createdAt: string;
}

interface Achievements {
  id: string;
  title: string;
  description: string;
  condition: string;
  points: number;
}
```

### RDS/Aurora (SQL Tables)

```sql
-- Items
id UUID PRIMARY KEY,
collectable_id UUID REFERENCES collectables(id),
player_id UUID REFERENCES players(id),
found_at TIMESTAMP

-- Trades
id UUID PRIMARY KEY,
from_player_id UUID REFERENCES players(id),
to_player_id UUID REFERENCES players(id),
offered_item_ids JSONB,
requested_item_ids JSONB,
status VARCHAR(32),
created_at TIMESTAMP,
completed_at TIMESTAMP
```

---

## Analytics Architecture

**DynamoDB:**

- Use DynamoDB Streams + AWS Lambda for basic count/event triggers.
- Not designed for complex or historical reporting.

**RDS/Aurora:**

- SQL-ready for login frequency, trade volumes, inventory stats, rare item drops.
- Compatible with BI tools/dashboarding.

---

## Load Distribution and AWS Free Tier Cost Analysis

### **Usage Model (1000 Active Players)**

- Player profile: 1-2 reads per day/player.
- Collectables/Achievements: 1 read each on login, cached.
- Items: 3-5 reads/day/player
- Trades: ~100 per day (multi-op transactions)
- Inventory: ~500 updates/day

### **DynamoDB Free Tier**

- 25 RCUs/WCUs (approx 200M requests/mo)
- 25GB storage
- Usage: Well below limit with caching, load optimization.

### **RDS Free Tier**

- 750 instance hours (db.t3.micro), 20GB storage
- Usage: ≤ 1000 players, comfortably under limit.

### **Lambda Free Tier**

- 1M invocations/month, 400K GB-seconds compute
- Usage: Estimated 160K invocations/month

### **Cost Optimization**

- Caching reduces reads dramatically.
- Trades/inventory offloaded to RDS for transactionality.
- Monitoring actual usage is crucial (AWS Cost Explorer/CloudWatch).

---

## Comparative Chart – DynamoDB vs RDS/Aurora

| Feature         | DynamoDB                     | RDS/Aurora                        |
| --------------- | ---------------------------- | --------------------------------- |
| Scaling         | Auto, massive                | High, vertical/horizontal scaling |
| Transactions    | Limited (single-table, keys) | Full ACID, multi-table            |
| Analytics       | Limited (streams, no joins)  | Full SQL, joins, BI integration   |
| Cost (low load) | Very low/free                | Free tier available               |

---

### Load Distribution Visualization

Consider including a simple chart illustrating where the read/write operations go:

```markdown
**Sample Load Distribution (for 1000 daily users):**

| Service    | Reads/Month | Writes/Month | Usage Pattern                  |
| ---------- | ----------- | ------------ | ------------------------------ |
| DynamoDB   | ~50,000     | ~10,000      | Initial login/load, cache hits |
| RDS/Aurora | ~10,000     | ~1,500       | Trades, inventory transactions |
| Lambda     | ~160,000    | N/A          | Backend API calls, processing  |

> _Visuals can be generated using bar or pie charts to show proportion of load._
```

If you want to graphically present these, use online tools for pie/bar charts, or embed as images once exported.

---

### Future Scaling Considerations

Add a section to show how the strategy supports future growth:

- As user count grows, **DynamoDB** remains cost-effective for stable data.
- **RDS/Aurora** can scale vertically/horizontally or upgrade instance size as transactional load increases (pay as you grow beyond free tier).
- Lambda auto-scales, but monitor invocation spikes.

---

### Change Justification Table

Include a matrix showing "Before" and "After" to highlight why specific migrations help:

```markdown
| Entity       | Old (DynamoDB only)      | New (Hybrid)                                    | Reason for Change              |
| ------------ | ------------------------ | ----------------------------------------------- | ------------------------------ |
| Players      | All profile/session data | Static in DynamoDB, sensitive/relational in RDS | Security, analytics, scaling   |
| Collectables | DynamoDB                 | DynamoDB                                        | Rare updates, fast global read |
| Achievements | N/A (future)             | DynamoDB                                        | Static, cached on client       |
| Items        | DynamoDB                 | RDS/Aurora                                      | Consistency, join performance  |
| Trades       | DynamoDB                 | RDS/Aurora                                      | ACID, multi-table transactions |
```

---

### Implementation Best Practices

- Use DynamoDB GSIs for flexible queries where possible.
- Ensure all sensitive data in RDS is encrypted at rest and in transit.
- Regularly review IAM roles and DB access permissions.
- Leverage AWS monitoring for proactive scaling alerts.
- Schedule regular backups for RDS and periodic exports for DynamoDB.

## Recommendations

- Store stable, read-heavy, rarely updated data in DynamoDB.
- Move transactional, critical, and relational data to RDS/Aurora (especially trade logic, inventory updates).
- Use client-side caching for collectables/achievements/data on load with push-notifications for changes.
- Store session tokens locally only.
- Monitor and alert for usage spikes and free tier overruns.
- Regularly audit table design as playerbase grows.
- Optimize Lambda code for minimal duration/memory.

### References & Tools

- GitHub - SamNewhouse/pineapple-donut
- Amazon DynamoDB Pricing | NoSQL Key-Value Database
- Amazon RDS Free Tier | Cloud Relational Database
- Text To PDF - Convert TXT to PDF online For Free
