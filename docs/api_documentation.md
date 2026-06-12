# API Documentation — Implemented Features

This document covers **only the APIs added or enhanced** for the take-home test features. Base endpoints (auth, orders, payments, delivery CRUD, etc.) are documented in [candidate_documentation.md](./candidate_documentation.md).

**Base URL:** `http://localhost:5000`

```bash
npm run dev
npm run seed
```

**Auth for protected routes:** Log in via `POST /api/auth/login`, then pass `Authorization: Bearer <token>`.

```bash
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.sharma@example.com","password":"Password@123"}'
```

---

## Task 1 — Advanced Search & Filtering

Enhanced query parameters on existing list/search endpoints.

### `GET /api/restaurants` — advanced restaurant search

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Name/description text search |
| `cuisine` | string | Cuisine filter |
| `rating` | number | Minimum rating |
| `lat`, `lng` | number | Geo coordinates |
| `distance` / `maxDistance` | number | Max distance (metres) |
| `isOpen` | boolean | Currently open |
| `avgDeliveryTime` | number | Max average delivery time (minutes) |
| `minimumOrderValue` | number | Max minimum order value |
| `sortBy` | string | `rating`, `distance`, `avgDeliveryTime`, `minimumOrderValue`, `name` |
| `sortOrder` | string | `asc` or `desc` |

```bash
# South Indian restaurants, rating ≥ 4, sorted by rating
curl -s "http://localhost:5000/api/restaurants?cuisine=South%20Indian&rating=4&sortBy=rating&sortOrder=desc"

# Near Mumbai, within 10 km
curl -s "http://localhost:5000/api/restaurants?lat=19.0760&lng=72.8777&distance=10000&sortBy=distance"

# Only open now
curl -s "http://localhost:5000/api/restaurants?isOpen=true&avgDeliveryTime=45"
```

### `GET /api/menu/search` — advanced menu search

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | Text search |
| `category` | string | Category filter |
| `priceMin`, `priceMax` | number | Price range |
| `dietaryRestrictions` | string | e.g. `vegetarian`, `vegan`, `gluten_free` |
| `excludeAllergens` | string | e.g. `nuts`, `dairy` |
| `minSpiceLevel`, `maxSpiceLevel` | number | 0–5 |
| `restaurantId` | string | Scope to one restaurant |
| `sortBy` | string | `price`, `popularity`, `name`, `spiceLevel` |
| `sortOrder` | string | `asc` or `desc` |

```bash
# Vegetarian dosa under ₹200, sorted by popularity
curl -s "http://localhost:5000/api/menu/search?query=dosa&dietaryRestrictions=vegetarian&priceMax=200&sortBy=popularity&sortOrder=desc"

# Exclude nuts, mild spice only
curl -s "http://localhost:5000/api/menu/search?excludeAllergens=nuts&maxSpiceLevel=2"
```

---

## Task 2 — Order Scheduling

### `POST /api/scheduling` — create scheduled order

**Auth:** Customer

Scheduled time must be **≥ 30 minutes** ahead and within restaurant operating hours. Processed automatically by cron; sends notifications.

**Body:**

```json
{
  "restaurantId": "RESTAURANT_ID",
  "scheduledFor": "2026-06-12T07:30:00.000Z",
  "paymentMethod": "upi",
  "items": [
    {
      "menuItemId": "MENU_ITEM_ID",
      "name": "Medu Vada",
      "quantity": 2,
      "price": 80,
      "customizations": []
    }
  ],
  "specialInstructions": "Pack chutney separately"
}
```

```bash
curl -s -X POST http://localhost:5000/api/scheduling \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId":"RESTAURANT_ID",
    "scheduledFor":"2026-06-12T07:30:00.000Z",
    "paymentMethod":"upi",
    "items":[{"menuItemId":"MENU_ITEM_ID","name":"Medu Vada","quantity":2,"price":80,"customizations":[]}]
  }'
```

### `GET /api/scheduling` — list scheduled orders

**Auth:** Any (role-filtered)

```bash
curl -s http://localhost:5000/api/scheduling \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `GET /api/scheduling/:id` — scheduled order detail

```bash
curl -s http://localhost:5000/api/scheduling/SCHEDULED_ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `PUT /api/scheduling/:id` — update scheduled order

**Auth:** Customer (owner only)

```json
{
  "scheduledFor": "2026-06-12T08:00:00.000Z",
  "items": [],
  "specialInstructions": "Updated note"
}
```

```bash
curl -s -X PUT http://localhost:5000/api/scheduling/SCHEDULED_ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduledFor":"2026-06-12T08:00:00.000Z"}'
```

---

## Task 3 — Loyalty Program

Points earned on **`delivered`** orders. FIFO redemption. Hourly cron expires points.

### `GET /api/loyalty/tiers` — loyalty tiers

**Auth:** Public

```bash
curl -s http://localhost:5000/api/loyalty/tiers
```

### `GET /api/loyalty/rewards` — available rewards

**Auth:** Public

```bash
curl -s http://localhost:5000/api/loyalty/rewards
```

### `GET /api/loyalty/summary` — balance & tier

**Auth:** Customer

```bash
curl -s http://localhost:5000/api/loyalty/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `GET /api/loyalty/transactions` — point history

**Auth:** Customer

| Param | Description |
|-------|-------------|
| `limit` | Max records (default 50) |

```bash
curl -s "http://localhost:5000/api/loyalty/transactions?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `POST /api/loyalty/redeem` — redeem reward

**Auth:** Customer

```json
{
  "rewardId": "REWARD_ID",
  "orderId": "ORDER_ID"
}
```

`orderId` is optional depending on reward type.

```bash
curl -s -X POST http://localhost:5000/api/loyalty/redeem \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rewardId":"REWARD_ID"}'
```

---

## Task 4 — Real-time Notifications

### `GET /api/notifications` — inbox

```bash
curl -s http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `GET /api/notifications/preferences`

```bash
curl -s http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `PUT /api/notifications/preferences`

```json
{
  "order": {
    "statusUpdates": true,
    "deliveryTracking": true,
    "restaurantMessages": true,
    "scheduledReminders": true
  },
  "loyalty": { "enabled": true },
  "promotion": { "enabled": true },
  "system": { "enabled": true }
}
```

```bash
curl -s -X PUT http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order":{"deliveryTracking":false}}'
```

### `PATCH /api/notifications/:id/read` — mark one read

```bash
curl -s -X PATCH http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `PATCH /api/notifications/read-all` — mark all read

```bash
curl -s -X PATCH http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `POST /api/notifications/messages` — restaurant → customer message

**Auth:** Restaurant

```json
{
  "orderId": "ORDER_ID",
  "message": "Your order is being prepared!",
  "idempotencyKey": "optional-unique-key"
}
```

```bash
curl -s -X POST http://localhost:5000/api/notifications/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","message":"Your dosa is almost ready!"}'
```

### Socket.io — real-time events

Connect with JWT in handshake auth:

```javascript
const socket = io('http://localhost:5000', { auth: { token: 'YOUR_JWT' } });
socket.emit('join:order', 'ORDER_ID'); // required for delivery tracking
```

| Event (listen) | Room | Description |
|----------------|------|-------------|
| `notification` | `user:{userId}` | Persisted notification payload |
| `order:status` | `user:{userId}` | Order status change |
| `delivery:location` | `order:{orderId}` | Live driver GPS |

| Event (emit) | Description |
|--------------|-------------|
| `join:order` | Join order room for `delivery:location` |

```bash
npm run socket-listener
```

Triggered automatically when order status changes, scheduled orders process, or delivery location updates.

---

## Task 5 — Analytics Dashboard

**Auth:** Restaurant owner, Admin

### `GET /api/analytics/dashboard`

| Param | Values | Default |
|-------|--------|---------|
| `period` | `day`, `week`, `month` | `day` |
| `restaurantId` | MongoDB ID | all owned (restaurant) / all (admin) |
| `from`, `to` | ISO dates | last 30 days |

**Returns:** sales aggregation, average order value, order frequency, customer retention, popular menu items, peak ordering hours, delivery performance.

```bash
curl -s "http://localhost:5000/api/analytics/dashboard?restaurantId=RESTAURANT_ID&period=day" \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -s "http://localhost:5000/api/analytics/dashboard?period=week&from=2026-01-01&to=2026-06-11" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### `GET /api/analytics/export`

| Param | Values | Default |
|-------|--------|---------|
| `format` | `json`, `csv` | `json` |
| `period`, `restaurantId`, `from`, `to` | same as dashboard | — |

```bash
curl -s "http://localhost:5000/api/analytics/export?format=csv&restaurantId=RESTAURANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -s "http://localhost:5000/api/analytics/export?format=json&period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Bonus — Multi-language Support

### Language resolution

Applied via middleware on all requests. Priority:

1. `?lang=hi` or `X-Explicit-Language` header
2. User `preferredLanguage`
3. `Accept-Language` header
4. `X-Country-Code` or address country (`IN` → Hindi)
5. Default: `en`

Supported: **`en`**, **`hi`**

Restaurant/menu content is localized from embedded `localizations` on GET responses:

```bash
curl -s http://localhost:5000/api/restaurants/RESTAURANT_ID \
  -H "Accept-Language: hi"

curl -s http://localhost:5000/api/menu/restaurant/RESTAURANT_ID \
  -H "Accept-Language: hi"
```

### `GET /api/translations` — system messages

Returns error/success/UI strings for the resolved locale.

```bash
curl -s http://localhost:5000/api/translations \
  -H "Accept-Language: hi"
```

### `POST /api/translations` — upsert system message

**Auth:** Admin

```json
{
  "category": "error_message",
  "key": "payment.failed",
  "locale": "hi",
  "value": "भुगतान विफल रहा"
}
```

```bash
curl -s -X POST http://localhost:5000/api/translations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category":"success_message",
    "key":"order.placed",
    "locale":"hi",
    "value":"आपका ऑर्डर सफलतापूर्वक दर्ज हो गया"
  }'
```

### `PUT /api/restaurants/:id/localizations` — restaurant copy

**Auth:** Restaurant owner, Admin

```json
{
  "locale": "hi",
  "name": "सरवणा स्वीट्स",
  "description": "दक्षिण भारतीय स्वाद"
}
```

```bash
curl -s -X PUT http://localhost:5000/api/restaurants/RESTAURANT_ID/localizations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locale":"hi","name":"सरवणा स्वीट्स","description":"मुंबई का प्यार"}'
```

### `PUT /api/restaurants/:id/menu/:menuItemId/localizations` — menu item copy

**Auth:** Restaurant owner, Admin

```json
{
  "locale": "hi",
  "name": "मसाला डोसा",
  "description": "कुरकुरा डोसा, मसालेदार आलू भरवां"
}
```

```bash
curl -s -X PUT http://localhost:5000/api/restaurants/RESTAURANT_ID/menu/MENU_ITEM_ID/localizations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locale":"hi","name":"मसाला डोसा","description":"कुरकुरा डोसा"}'
```

---

## Seeded test accounts

| Email | Role | Password |
|-------|------|----------|
| priya.sharma@example.com | customer | Password@123 |
| arjun.patel@example.com | customer | Password@123 |
| ravi.mehta@example.com | restaurant (Saravana) | Password@123 |
| kavita.reddy@example.com | restaurant (Paradise) | Password@123 |
| vikram.singh@example.com | delivery | Password@123 |
| ananya.iyer@example.com | admin | Password@123 |

See **[Use Case Guide](./use_case_guide.md)** for end-to-end testing flows.
