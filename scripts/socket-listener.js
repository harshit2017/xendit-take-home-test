const { io } = require('socket.io-client');

const SEED_PASSWORD = 'Password@123';
const SEED_USERS = {
  priya: 'priya.sharma@example.com',
  arjun: 'arjun.patel@example.com',
  ravi: 'ravi.mehta@example.com',
  kavita: 'kavita.reddy@example.com',
  vikram: 'vikram.singh@example.com',
  ananya: 'ananya.iyer@example.com',
};

const userKey = process.env.USER_KEY || 'arjun';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const email = SEED_USERS[userKey];

async function login() {
  if (process.env.TOKEN) {
    return process.env.TOKEN;
  }

  if (!email) {
    throw new Error(`Unknown USER_KEY "${userKey}". Use: ${Object.keys(SEED_USERS).join(', ')}`);
  }

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: SEED_PASSWORD }),
  });

  const body = await response.json();
  const token = body?.data?.token;

  if (!token) {
    throw new Error(body?.message || 'Login failed — run npm run seed and ensure the server is running');
  }

  return token;
}

async function resolveOrderId(token) {
  if (process.env.ORDER_ID) {
    return process.env.ORDER_ID;
  }

  const response = await fetch(`${BASE_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await response.json();
  const orders = body?.data?.orders ?? [];
  const order =
    orders.find((o) => o.status === 'confirmed') ||
    orders.find((o) => o.status === 'out_for_delivery') ||
    orders[0];

  if (!order?._id) {
    throw new Error('No orders found — set ORDER_ID or seed the database (npm run seed)');
  }

  return order._id;
}

async function main() {
  const token = await login();
  const orderId = await resolveOrderId(token);

  console.log(`Connecting as ${userKey} (${email}) to ${BASE_URL}`);
  console.log(`Listening for order ${orderId} (join:order)`);

  const socket = io(BASE_URL, {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Connected:', socket.id);
    socket.emit('join:order', orderId);
  });

  socket.on('notification', (data) => {
    console.log('NOTIFICATION:', JSON.stringify(data, null, 2));
  });

  socket.on('order:status', (data) => {
    console.log('ORDER STATUS:', data);
  });

  socket.on('delivery:location', (data) => {
    console.log('DELIVERY LOCATION:', data);
  });

  socket.on('connect_error', (err) => {
    console.error('Connect failed:', err.message);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
