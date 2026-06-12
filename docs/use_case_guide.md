# Use Case Guide

End-to-end scenarios for testing the food delivery API. Every example uses **curl only** — no shell `export` commands.

**Prerequisites:** Server running (`npm run dev`), database seeded (`npm run seed`).

Use the login curl in each section to get a fresh token, then paste it where you see `YOUR_TOKEN`. Copy resource IDs from API responses (list restaurants, orders, etc.).

All seeded users password: **`Password@123`**

---

## Seeded data overview

| User | Email | Role |
|------|-------|------|
| Priya Sharma | priya.sharma@example.com | Customer — has delivered order + 476 loyalty points |
| Arjun Patel | arjun.patel@example.com | Customer — has confirmed order assigned to Vikram |
| Ravi Mehta | ravi.mehta@example.com | Owner of Saravana Sweets & Snacks (Mumbai) |
| Kavita Reddy | kavita.reddy@example.com | Owner of Paradise Biryani House (Bengaluru) |
| Vikram Singh | vikram.singh@example.com | Delivery driver |
| Ananya Iyer | ananya.iyer@example.com | Admin |

Pre-seeded orders in the database:

- Priya — delivered Saravana order (loyalty points already earned)
- Arjun — confirmed Paradise biryani order (assigned to Vikram)

Find order IDs via `GET /api/orders` after logging in as the relevant user.

---

## Use Case 1 — Customer discovers food in Hindi

**Goal:** Priya browses South Indian restaurants and reads the menu in Hindi.

**Step 1 — Login as Priya**

```bash
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.sharma@example.com","password":"Password@123"}'
```

Copy `data.token` from the response.

**Step 2 — Search restaurants in Hindi**

```bash
curl -s "http://localhost:5000/api/restaurants?search=saravana&lang=hi" \
  -H "Accept-Language: hi"
```

**Step 3 — Get Saravana details (Hindi name: सरवणा स्वीट्स)**

Use `restaurants.saravana` from seed manifest:

```bash
curl -s http://localhost:5000/api/restaurants/PASTE_SARAVANA_ID_HERE \
  -H "Accept-Language: hi"
```

**Step 4 — View localized menu**

```bash
curl -s http://localhost:5000/api/menu/restaurant/PASTE_SARAVANA_ID_HERE \
  -H "Accept-Language: hi"
```

**Step 5 — Load Hindi system messages**

```bash
curl -s http://localhost:5000/api/translations \
  -H "Accept-Language: hi"
```

---

## Use Case 2 — Customer places a new order

**Goal:** Priya orders biryani from Paradise Biryani House.

**Step 1 — Login**

```bash
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.sharma@example.com","password":"Password@123"}'
```

**Step 2 — Place order**

Use `restaurants.paradise` and `menuItems.chicken_biryani` from seed manifest:

```bash
curl -s -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "PASTE_PARADISE_ID_HERE",
    "paymentMethod": "upi",
    "items": [
      {
        "menuItemId": "PASTE_BIRYANI_ID_HERE",
        "name": "Hyderabadi Chicken Biryani",
        "quantity": 1,
        "price": 320,
        "customizations": []
      }
    ],
    "specialInstructions": "Extra raita please"
  }'
```

**Step 3 — View my orders**

```bash
curl -s http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Step 4 — Process payment** (use `_id` from create order response)

```bash
curl -s -X POST http://localhost:5000/api/payments/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "PASTE_NEW_ORDER_ID_HERE",
    "paymentMethod": {"type": "upi", "details": {"vpa": "priya@upi"}}
  }'
```

---

## Use Case 3 — Full delivery flow with live tracking

**Goal:** Vikram delivers Arjun's order; Arjun receives socket notifications and location updates.

### Terminal A — Start socket listener (Arjun's perspective)

```bash
USER_KEY=arjun npm run socket-listener
```

### Terminal B — Driver actions

**Step 1 — Login as Vikram**

```bash
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vikram.singh@example.com","password":"Password@123"}'
```

**Step 2 — View assigned orders**

```bash
curl -s http://localhost:5000/api/delivery/orders \
  -H "Authorization: Bearer YOUR_VIKRAM_TOKEN"
```

**Step 3 — Mark out for delivery**

Use `orders.arjunPendingOrder` from seed manifest:

```bash
curl -s -X PUT http://localhost:5000/api/orders/PASTE_ARJUN_ORDER_ID/status \
  -H "Authorization: Bearer YOUR_VIKRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"out_for_delivery"}'
```

→ Terminal A should show `notification` and `order:status` events.

**Step 4 — Send GPS update**

```bash
curl -s -X POST http://localhost:5000/api/delivery/location \
  -H "Authorization: Bearer YOUR_VIKRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "PASTE_ARJUN_ORDER_ID",
    "location": {"latitude": 12.9352, "longitude": 77.6245},
    "status": "out_for_delivery",
    "message": "5 minutes away"
  }'
```

→ Terminal A should show `delivery:location`.

**Step 5 — Mark delivered (Arjun earns loyalty points)**

```bash
curl -s -X PUT http://localhost:5000/api/orders/PASTE_ARJUN_ORDER_ID/status \
  -H "Authorization: Bearer YOUR_VIKRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"delivered"}'
```

### Terminal C — Customer checks tracking via REST

**Login as Arjun**, then:

```bash
curl -s http://localhost:5000/api/delivery/orders/PASTE_ARJUN_ORDER_ID/track \
  -H "Authorization: Bearer YOUR_ARJUN_TOKEN"

curl -s http://localhost:5000/api/delivery/orders/PASTE_ARJUN_ORDER_ID/eta \
  -H "Authorization: Bearer YOUR_ARJUN_TOKEN"
```

---

## Use Case 4 — Restaurant owner messaging & notifications

**Goal:** Ravi sends a prep update to Priya about her past order.

**Step 1 — Login as Ravi**

```bash
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ravi.mehta@example.com","password":"Password@123"}'
```

**Step 2 — View restaurant orders**

```bash
curl -s http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_RAVI_TOKEN"
```

**Step 3 — Message customer**

Use `orders.priyaDeliveredOrder`:

```bash
curl -s -X POST http://localhost:5000/api/notifications/messages \
  -H "Authorization: Bearer YOUR_RAVI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "PASTE_PRIYA_ORDER_ID",
    "message": "Thank you Priya! Hope you enjoyed the Masala Dosa."
  }'
```

**Step 4 — Priya checks inbox**

Login as Priya, then:

```bash
curl -s http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN"

curl -s -X PATCH http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN"
```

---

## Use Case 5 — Schedule an order for later

**Goal:** Priya schedules Medu Vada for tomorrow lunch.

**Step 1 — Login as Priya**

**Step 2 — Create scheduled order** (must be ≥ 30 min ahead, within operating hours)

Use `restaurants.saravana` and `menuItems.medu_vada`. Set `scheduledFor` to a valid future ISO timestamp:

```bash
curl -s -X POST http://localhost:5000/api/scheduling \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "PASTE_SARAVANA_ID",
    "scheduledFor": "2026-06-12T07:30:00.000Z",
    "paymentMethod": "upi",
    "items": [
      {
        "menuItemId": "PASTE_MEDU_VADA_ID",
        "name": "Medu Vada",
        "quantity": 2,
        "price": 80,
        "customizations": []
      }
    ],
    "specialInstructions": "Pack chutney separately"
  }'
```

**Step 3 — List scheduled orders**

```bash
curl -s http://localhost:5000/api/scheduling \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN"
```

**Step 4 — Reschedule** (use `_id` from step 2)

```bash
curl -s -X PUT http://localhost:5000/api/scheduling/PASTE_SCHEDULED_ORDER_ID \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduledFor": "2026-06-12T08:00:00.000Z"}'
```

The cron job (runs every minute) will send reminder and processing notifications when the time arrives.

---

## Use Case 6 — Loyalty program

**Goal:** Priya checks points and redeems a reward.

**Step 1 — Login as Priya**

**Step 2 — View summary** (seed data: ~476 points, Bronze tier)

```bash
curl -s http://localhost:5000/api/loyalty/summary \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN"
```

**Step 3 — Transaction history**

```bash
curl -s http://localhost:5000/api/loyalty/transactions \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN"
```

**Step 4 — Browse rewards & tiers**

```bash
curl -s http://localhost:5000/api/loyalty/rewards
curl -s http://localhost:5000/api/loyalty/tiers
```

**Step 5 — Redeem** (copy a reward `_id` from step 4)

```bash
curl -s -X POST http://localhost:5000/api/loyalty/redeem \
  -H "Authorization: Bearer YOUR_PRIYA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rewardId": "PASTE_REWARD_ID_HERE"}'
```

---

## Use Case 7 — Restaurant analytics

**Goal:** Kavita reviews Paradise Biryani sales dashboard.

**Step 1 — Login as Kavita**

```bash
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kavita.reddy@example.com","password":"Password@123"}'
```

**Step 2 — Daily dashboard**

```bash
curl -s "http://localhost:5000/api/analytics/dashboard?restaurantId=PASTE_PARADISE_ID&period=day" \
  -H "Authorization: Bearer YOUR_KAVITA_TOKEN"
```

**Step 3 — Weekly view with date range**

```bash
curl -s "http://localhost:5000/api/analytics/dashboard?restaurantId=PASTE_PARADISE_ID&period=week&from=2026-01-01&to=2026-06-11" \
  -H "Authorization: Bearer YOUR_KAVITA_TOKEN"
```

**Step 4 — Export as CSV**

```bash
curl -s "http://localhost:5000/api/analytics/export?format=csv&restaurantId=PASTE_PARADISE_ID" \
  -H "Authorization: Bearer YOUR_KAVITA_TOKEN"
```

**Step 5 — Ravi checks Saravana** (has Priya's delivered order in seed)

Login as Ravi, then:

```bash
curl -s "http://localhost:5000/api/analytics/dashboard?restaurantId=PASTE_SARAVANA_ID&period=day" \
  -H "Authorization: Bearer YOUR_RAVI_TOKEN"
```

---

## Use Case 8 — Admin operations

**Goal:** Ananya manages translations and assigns delivery.

**Step 1 — Login as Ananya**

```bash
curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ananya.iyer@example.com","password":"Password@123"}'
```

**Step 2 — Add Hindi translation**

```bash
curl -s -X POST http://localhost:5000/api/translations \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "success_message",
    "key": "order.placed",
    "locale": "hi",
    "value": "आपका ऑर्डर सफलतापूर्वक दर्ज हो गया"
  }'
```

**Step 3 — List available delivery personnel**

```bash
curl -s http://localhost:5000/api/delivery/personnel \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Step 4 — Assign driver to order**

```bash
curl -s -X PUT http://localhost:5000/api/orders/PASTE_ORDER_ID/assign \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryPersonId": "PASTE_VIKRAM_USER_ID"}'
```

**Step 5 — Platform-wide analytics**

```bash
curl -s "http://localhost:5000/api/analytics/dashboard?period=month" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Use Case 9 — Advanced search

**Goal:** Find vegetarian South Indian food near Mumbai.

```bash
curl -s "http://localhost:5000/api/restaurants?cuisine=South%20Indian&rating=4&lat=19.0760&lng=72.8777&distance=10000&sortBy=rating&sortOrder=desc"
```

Search menu items across restaurants:

```bash
curl -s "http://localhost:5000/api/menu/search?query=dosa&dietaryRestrictions=vegetarian&priceMax=200"
```

Find nearby restaurants:

```bash
curl -s "http://localhost:5000/api/restaurants/nearby?lat=12.9716&lng=77.5946&distance=5000"
```

---

## Use Case 10 — Restaurant owner updates Hindi content

**Goal:** Ravi adds/updates Hindi localization for Saravana.

**Step 1 — Login as Ravi**

**Step 2 — Update restaurant Hindi copy**

```bash
curl -s -X PUT http://localhost:5000/api/restaurants/PASTE_SARAVANA_ID/localizations \
  -H "Authorization: Bearer YOUR_RAVI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "hi",
    "name": "सरवणा स्वीट्स",
    "description": "मुंबई का पसंदीदा दक्षिण भारतीय स्वाद"
  }'
```

**Step 3 — Update menu item Hindi copy**

```bash
curl -s -X PUT http://localhost:5000/api/restaurants/PASTE_SARAVANA_ID/menu/PASTE_MASALA_DOSA_ID/localizations \
  -H "Authorization: Bearer YOUR_RAVI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "hi",
    "name": "मसाला डोसा",
    "description": "कुरकुरा डोसा, मसालेदार आलू भरवां"
  }'
```

**Step 4 — Verify in Hindi**

```bash
curl -s http://localhost:5000/api/restaurants/PASTE_SARAVANA_ID \
  -H "Accept-Language: hi"
```

---

## Use Case 11 — Notification preferences

**Goal:** Arjun disables delivery tracking notifications.

**Step 1 — Login as Arjun**

**Step 2 — Get current preferences**

```bash
curl -s http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_ARJUN_TOKEN"
```

**Step 3 — Disable delivery tracking**

```bash
curl -s -X PUT http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_ARJUN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "statusUpdates": true,
      "deliveryTracking": false,
      "restaurantMessages": true,
      "scheduledReminders": true
    }
  }'
```

After this, Vikram's location updates will not emit `delivery:location` to Arjun (REST track endpoint still works).

---

## Use Case 12 — Payment refund (restaurant)

**Goal:** Kavita refunds a cancelled order.

```bash
curl -s -X POST http://localhost:5000/api/payments/PASTE_ORDER_ID/refund \
  -H "Authorization: Bearer YOUR_KAVITA_TOKEN"
```

---

## Quick reference — login curls by role

```bash
# Customer — Priya
curl -s http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"priya.sharma@example.com","password":"Password@123"}'

# Customer — Arjun
curl -s http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"arjun.patel@example.com","password":"Password@123"}'

# Restaurant — Ravi (Saravana)
curl -s http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ravi.mehta@example.com","password":"Password@123"}'

# Restaurant — Kavita (Paradise)
curl -s http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"kavita.reddy@example.com","password":"Password@123"}'

# Delivery — Vikram
curl -s http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"vikram.singh@example.com","password":"Password@123"}'

# Admin — Ananya
curl -s http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ananya.iyer@example.com","password":"Password@123"}'
```

---

Use `GET /api/restaurants` or `GET /api/orders` to copy IDs from responses.

See also: **[API Documentation](./api_documentation.md)** for full endpoint reference.
