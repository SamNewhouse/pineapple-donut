# 🍩 Pineapple Donut

A serverless backend API built with AWS Lambda and the Serverless Framework, providing authentication, item management, and trading functionality for the Pineapple game ecosystem.

## 📂 Project Structure

```
src/
├── core/         # Core utilities and configurations
├── handlers/     # Lambda function handlers
│   ├── auth/     # Authentication endpoints
│   └── game/     # Game-related endpoints
├── scripts/      # Database setup and utility scripts
└── types/        # TypeScript type definitions
```

## 🔧 Architecture

### Database Tables

- **Players**: User accounts and player profiles
- **ItemCatalog**: Master list of all available items
- **Items**: Player-owned item instances
- **Trades**: Trading transactions between players

### API Endpoints

#### Authentication

- `POST /auth/signup` - Create new player account
- `POST /auth/login` - Player authentication
- `GET /player/{playerId}` - Get player profile

#### Game Features

- `POST /scan/validate` - Validate scanned item
- `POST /scan/process` - Process item scan and add to inventory
- `GET /player/{playerId}/items` - Get player's items
- `GET /item/{itemId}` - Get specific item details

#### Trading System

- `POST /trade/create` - Create new trade offer
- `GET /trade/{tradeId}` - Get trade details
- `POST /trade/{tradeId}/accept` - Accept trade offer
- `POST /trade/{tradeId}/reject` - Reject trade offer
- `POST /trade/{tradeId}/cancel` - Cancel trade offer
- `GET /player/{playerId}/trades` - Get player's trades

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- AWS CLI configured
- Docker & Docker Compose
- Serverless CLI (`npm install -g serverless`)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/SamNewhouse/pineapple-donut.git
cd pineapple-donut
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
JWT_SECRET="your-jwt-secret"
DYNAMODB_ENDPOINT="http://localhost:8000"  # for local development
```

### Local Development

1. Start local DynamoDB:

```bash
npm run dynamo
```

2. Create database tables:

```bash
npm run table:create
```

3. Seed with sample data (optional):

```bash
npm run table:seed
```

4. Start the development server:

```bash
npm start
```

The API will be available at `http://localhost:3000`

### Available Scripts

- `npm start` - Build and start offline server
- `npm run build` - Compile TypeScript
- `npm run deploy` - Deploy to AWS
- `npm run offline` - Start serverless offline
- `npm run dynamo` - Start local DynamoDB
- `npm run table:create` - Create database tables
- `npm run table:seed` - Seed database with sample data
- `npm run gen-items` - Generate random items
- `npm run clean` - Clean build directory

## 🌐 Deployment

Deploy to AWS:

```bash
npm run deploy
```

Deploy to specific stage:

```bash
serverless deploy --stage production
```

## 🔒 Security

- JWT tokens for API authentication
- Google OAuth integration for user login
- CORS enabled for cross-origin requests
- Environment-based configuration for secrets

## 📊 Database Schema

### Players Table

- Primary Key: `playerId` (String)
- GSI: `EmailIndex` on `email`

### ItemCatalog Table

- Primary Key: `itemId` (String)

### Items Table

- Primary Key: `itemId` (String)
- GSI: `PlayerIndex` on `playerId`

### Trades Table

- Primary Key: `tradeId` (String)
- GSI: `FromPlayerIndex` on `fromPlayerId`
- GSI: `ToPlayerIndex` on `toPlayerId`

## 🧪 Testing

The service can be tested locally using:

- Serverless Offline for API endpoints
- Docker Compose for DynamoDB
- Postman/curl for endpoint testing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

**Sam Newhouse**

- Website: [www.samnewhouse.co.uk](https://www.samnewhouse.co.uk)
- GitHub: [@SamNewhouse](https://github.com/SamNewhouse)
