# 🍩 Pineapple Donut

## TODO

#### 🛠 API Endpoints & Data Model

- [ ] Player profile fields  
       _Add new fields (bio, stats, profile info) to Player schema. Provide endpoint to allow players to update only approved profile fields._
- [x] Rarity Table Endpoints
      _Add REST API endpoints for CRUD operations on the Rarity table in the backend. Ensure docs are updated and test integration in the app_
- [ ] Achievements integration  
       _Add an `achievements` array to Player schema. Maintain Achievements catalog table. Endpoints to add/remove achievements for players. Clients can cache catalog locally._
- [ ] Achievements CRUD API  
       _Create, update, and soft-delete endpoints for Achievements (catalog management); "get all" and fetch by id endpoints should also exist._
- [ ] Favourites integration  
       _Add boolean field to owned Item records for marking favourites. Endpoints to toggle/reset (when traded)._
- [ ] Collectable CRUD API  
       _Create, update, soft-delete endpoints for Collectables; "get all" exists._
- [ ] Notifications API
      _Endpoints to send, store, retrieve player notifications._
- [ ] Advanced search/filter API  
       _Endpoints to query/filter items/trades by type, rarity, player, or criteria._

#### 🧪 Validation, Testing & Versions

- [ ] Add OpenAPI docs for all endpoints  
       _Swagger/OpenAPI spec for all backend APIs._
- [ ] Input validation  
       _Strict schema checks using zod/joi/yup for all incoming data._
- [ ] Integration test coverage  
       _Thorough error/edge-case tests for all endpoints._
- [ ] Pagination improvements  
       _Stable, predictable pagination in all list APIs._
- [ ] Data normalization  
       _Standardized request/response object structure._
- [ ] Versioned endpoints  
       _Support multiple API versions as features/schema change._

#### ⚡ Performance & Scaling

- [ ] Batched reads/writes  
       _Efficient DynamoDB batch operations for relevant endpoints._
- [ ] Index optimization  
       _Tune and document DB indexes for API/query performance._
- [ ] Rate/throttle controls  
       _Apply limits/throttling to resource-intensive endpoints._
- [ ] Caching support  
       _Design endpoints that leverage Redis/DAX for frequent queries._
- [ ] Bulk import/export APIs  
       _Admin endpoints for mass data operations._
- [ ] Scheduled maintenance endpoints  
       _Automated cleanups, background jobs, health tasks._

#### 💸 Monitoring, Cost & Ops

- [ ] Github Actions Workflows
      _Set up basic CI/CD workflows in .github/workflows to automate lint, test, and deploy jobs._
- [ ] Budget/usage metrics  
       _Monitor request volume, error rates, billing through API/metrics._
- [ ] Centralized logging  
       _Implement pino/winston and Sentry/X-Ray integration for errors/performance._
- [ ] Health check endpoint  
       _Standard `/health` or `/status` for service uptime._
- [ ] Migration/seeding scripts  
       _Scripts for DB migrations and test data setup._
- [ ] Business metrics endpoint  
       _Dashboards for app/trade usage, key stats._
- [ ] Anomaly detection  
       _Backend logic to record and flag unusual traffic/cost spikes._

#### 🔒 Security & Reliability

- [ ] Permissions/middleware  
       _Role-based middleware for endpoint authorization._
- [ ] Secrets management  
       _Rotate and store secrets securely using AWS Secrets Manager/SSM._
- [ ] Data sanitization  
       _Reject/clean unsafe input on all APIs before DB operations._
- [ ] Multi-AZ deployment  
       _High-availability config for multiple AWS zones._
- [ ] Dependency automation  
       _Automated security/version updates for dependencies._
- [ ] Admin audit logging  
       _Track admin/critical API actions for compliance._

#### 📚 Documentation & Developer Experience

- [ ] API badges/status  
       _README badges for backend builds, health, and code coverage._
- [ ] Architecture/service diagrams  
       _Diagrams showing API, Lambdas, DB flow for onboarding._
- [ ] Endpoint usage/error examples  
       _Sample requests, responses, and errors for docs._
- [ ] Local/dev tools  
       _Scripts/guides for serverless offline, local test DBs, mock data._
- [ ] Lint/style enforcement  
       _Automated code style checks and standards._

#### 🧬 Advanced Backend Features

- [ ] Activity analytics API  
       _Expose aggregated system/player activity data._
- [ ] Role-based access  
       _Admin/mod permissions enforced at endpoint level._
- [ ] Feature toggles  
       _Configurable switches for enabling/disabling features._
- [ ] Webhooks/data hooks  
       _Trigger external notifications/events on major backend actions._
- [ ] Multi-region/DR  
       _Enable multi-region setup/data sync for disaster recovery._
