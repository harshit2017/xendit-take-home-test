# Food Delivery App — Backend Take Home Test

Backend API for a food delivery platform built with **Node.js**, **TypeScript**, **Express**, **MongoDB**, and **Socket.io**. This submission implements all five core features plus multi-language support.

## Implemented Features

| Feature | Summary |
|---------|---------|
| **Advanced search** | Restaurant filters (cuisine, rating, geo distance, open hours, delivery time) and menu search (price, dietary tags, allergens, spice level) with sorting |
| **Order scheduling** | Create, list, update, and cancel future orders; cron job processes due orders and sends reminders |
| **Loyalty program** | Points on delivered orders, tiered rewards, FIFO redemption, hourly expiration cron |
| **Real-time notifications** | Socket.io events, persisted inbox, per-category preferences, restaurant-to-customer messages |
| **Analytics** | Restaurant dashboard (sales, retention, popular items, peak hours, delivery metrics) with JSON/CSV export |
| **Multi-language (bonus)** | English and Hindi via middleware; localized restaurant/menu content and admin-managed system translations |

## Tech Stack

- **Runtime:** Node.js, TypeScript
- **API:** Express, express-validator
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Jobs:** node-cron (scheduled orders, loyalty expiration)
- **Testing:** Jest (49 unit tests, coverage thresholds enforced)

## Getting Started

### Prerequisites

- Node.js v18+ (v14+ should work)
- npm
- MongoDB (local or Docker)

### Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

3. Start MongoDB (Docker):

   ```bash
   docker-compose up -d
   ```

   Or use a local MongoDB instance and set `MONGODB_URI` in `.env`.

4. Seed demo data (Indian restaurants, users, menu items, translations):

   ```bash
   npm run seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   The API runs at `http://localhost:5000`.

### Seeded Test Accounts

All seeded users share the password **`Password@123`**.

| Email | Role |
|-------|------|
| priya.sharma@example.com | customer |
| arjun.patel@example.com | customer |
| ravi.mehta@example.com | restaurant (Saravana Sweets) |
| kavita.reddy@example.com | restaurant (Paradise Biryani) |
| vikram.singh@example.com | delivery |
| ananya.iyer@example.com | admin |

Log in via `POST /api/auth/login`, then pass `Authorization: Bearer <token>` on protected routes.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run seed` | Populate database with demo data |
| `npm run socket-listener` | Connect to Socket.io and log notifications (logs in via API) |

## New API Endpoints

Full curl examples are in [docs/api_documentation.md](./docs/api_documentation.md). End-to-end flows are in [docs/use_case_guide.md](./docs/use_case_guide.md).

### Search

- `GET /api/restaurants` — advanced restaurant search (query params: `search`, `cuisine`, `rating`, `lat`/`lng`/`distance`, `isOpen`, `sortBy`, etc.)
- `GET /api/menu/search` — menu search (`query`, `category`, `priceMin`/`priceMax`, `dietaryRestrictions`, `excludeAllergens`, `sortBy`, etc.)

### Scheduling

- `POST /api/scheduling` — create scheduled order (customer)
- `GET /api/scheduling` — list scheduled orders (role-filtered)
- `GET /api/scheduling/:id` — scheduled order detail
- `PUT /api/scheduling/:id` — update scheduled order (customer owner)
- `DELETE /api/scheduling/:id` — cancel scheduled order (customer owner)

### Loyalty

- `GET /api/loyalty/tiers` — loyalty tiers (public)
- `GET /api/loyalty/rewards` — available rewards (public)
- `GET /api/loyalty/summary` — balance and tier (customer)
- `GET /api/loyalty/transactions` — point history (customer)
- `POST /api/loyalty/redeem` — redeem a reward (customer)

### Notifications

- `GET /api/notifications` — notification inbox
- `GET /api/notifications/preferences` — read preferences
- `PUT /api/notifications/preferences` — update preferences
- `PATCH /api/notifications/:id/read` — mark one read
- `PATCH /api/notifications/read-all` — mark all read
- `POST /api/notifications/messages` — restaurant message to customer

**Socket.io events:** `notification`, `order:status`, `delivery:location` — connect with JWT in handshake auth; emit `join:order` for delivery tracking. Use `npm run socket-listener` to test.

### Analytics

- `GET /api/analytics/dashboard` — sales, retention, popular items, peak hours, delivery metrics
- `GET /api/analytics/export` — export as `json` or `csv`

### Multi-language

- `GET /api/translations` — system messages for resolved locale
- `POST /api/translations` — upsert system message (admin)
- `PUT /api/restaurants/:id/localizations` — restaurant copy (restaurant/admin)
- `PUT /api/restaurants/:id/menu/:menuItemId/localizations` — menu item copy (restaurant/admin)

Language is resolved per request via `?lang=`, `Accept-Language`, user preference, or country code. Restaurant and menu GET responses return localized fields when available.

## Design Decisions

- **Layered architecture** — routes → controllers → services → models, matching the existing codebase patterns.
- **Search utilities** — shared filtering/sorting logic in `src/utils/search.utils.ts` keeps restaurant and menu services focused on data access.
- **Cron jobs** — scheduled orders and loyalty expiration run in-process via `node-cron`; suitable for a take-home; would move to a job queue (Bull, SQS) in production.
- **Notifications** — dual delivery: persist to MongoDB for inbox/history and emit via Socket.io for real-time. Preferences gate both channels.
- **Loyalty FIFO** — point lots are consumed oldest-first on redemption; expiration cron marks expired lots and adjusts balances.
- **i18n** — middleware resolves locale once per request; entity content uses embedded `localizations` arrays; system strings live in a `translations` collection.
- **Seeds** — idempotent seed script drops stale indexes and repopulates collections only (no token generation or manifest files).

## Challenges & Trade-offs

- **Route ordering** — `GET /api/restaurants/search` is registered after `/:id` and is effectively shadowed; use `GET /api/restaurants` with query params instead.
- **Analytics aggregation** — `restaurantId` in dashboard queries should be cast to `ObjectId` in `$match` stages for reliable results when filtering by restaurant.
- **Socket.io auth** — JWT validated on connection; users join `user:{userId}` automatically; clients must emit `join:order` for per-order delivery tracking.
- **Scheduling validation** — minimum 30-minute lead time and operating-hours checks prevent invalid slots but rely on server timezone; production would use explicit timezone per restaurant.

## Future Improvements

- Fix analytics `ObjectId` matching and register search routes before parameterized routes.
- Add integration tests for API endpoints and Socket.io flows.
- Move cron jobs to a dedicated worker with retry and dead-letter handling.
- Support pagination on search, notifications, and analytics export for large datasets.
- Add Redis adapter for Socket.io horizontal scaling.
- Expand i18n to more locales and fallback chains.
- Add rate limiting per user/role on analytics and search endpoints.

## Documentation

| Document | Description |
|----------|-------------|
| [API Documentation](./docs/api_documentation.md) | New endpoints with curl examples |
| [Use Case Guide](./docs/use_case_guide.md) | End-to-end testing scenarios |
| [Candidate Documentation](./docs/candidate_documentation.md) | Original codebase overview |
| [Architecture](./docs/architecture.md) | Project structure and patterns |
| [Docker Setup](./docs/docker_setup.md) | Docker and MongoDB setup |

## Testing

```bash
npm test
```

All 49 unit tests pass. Coverage thresholds are configured in `jest.config.js` for services and utilities added in this submission.
