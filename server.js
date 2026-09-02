import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const jwtSecret = process.env.JWT_SECRET || 'erpcrm-development-secret';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Helper functions & middleware
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
});

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
};

const roles = (...allowed) => (req, res, next) => {
  if (allowed.includes(req.user.role)) return next();
  return res.status(403).json({ error: 'You do not have access to this action' });
};

const fail = (res, error) => res.status(400).json({ error: error?.message || 'Request could not be completed' });

// Database initial seeder
async function seed() {
  const { data: existingUsers } = await supabase.from('users').select('*').limit(1);
  let admin = existingUsers?.[0];

  if (!admin) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const { data: users } = await supabase.from('users').insert([
      { email: 'admin@northstar.com', name: 'Aarav Mehta', role: 'admin', password_hash: passwordHash },
      { email: 'sales@northstar.com', name: 'Priya Shah', role: 'sales', password_hash: passwordHash },
      { email: 'warehouse@northstar.com', name: 'Rohan Kumar', role: 'warehouse', password_hash: passwordHash },
      { email: 'accounts@northstar.com', name: 'Neha Joshi', role: 'accounts', password_hash: passwordHash }
    ]).select();
    admin = users?.[0];
  }

  const { count: productCount } = await supabase.from('products').select('id', { count: 'exact', head: true });
  if (!productCount) {
    const { data: products } = await supabase.from('products').insert([
      { name: 'Premium Basmati Rice', sku: 'RICE-001', category: 'Grains', unit_price: 1250, min_stock_alert: 25, location: 'Warehouse A' },
      { name: 'Cold Pressed Groundnut Oil', sku: 'OIL-014', category: 'Edibles', unit_price: 890, min_stock_alert: 15, location: 'Warehouse A' },
      { name: 'Organic Turmeric Powder', sku: 'SPC-032', category: 'Spices', unit_price: 320, min_stock_alert: 20, location: 'Warehouse B' }
    ]).select();

    if (products?.length) {
      await supabase.from('stock_movements').insert(
        products.map((product, index) => ({
          product_id: product.id,
          quantity_change: [80, 42, 12][index],
          movement_type: 'IN',
          reason: 'Opening stock',
          created_by: admin?.id
        }))
      );
    }
  }

  const { count: customerCount } = await supabase.from('customers').select('id', { count: 'exact', head: true });
  if (!customerCount) {
    await supabase.from('customers').insert([
      { name: 'Vijay Traders', business_name: 'Vijay Traders & Sons', mobile: '9876543210', email: 'orders@vijaytraders.com', customer_type: 'wholesale', status: 'active', notes: 'Weekly replenishment customer', created_by: admin?.id },
      { name: 'Ananya Retail', business_name: 'Ananya Retail Store', mobile: '9812345678', customer_type: 'retail', status: 'lead', follow_up_date: '2026-09-05', created_by: admin?.id }
    ]);
  }
}

// ── API Router ───────────────────────────────────────────────
const router = express.Router();

// ── Auth Endpoints
router.post('/auth/signup', async (req, res) => {
  const { name, email, password, role = 'sales' } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const validRoles = ['admin', 'sales', 'warehouse', 'accounts'];
  const userRole = validRoles.includes(role) ? role : 'sales';
  const cleanEmail = email.toLowerCase().trim();

  const { data: existingUser } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase.from('users').insert({
    name: name.trim(),
    email: cleanEmail,
    password_hash: passwordHash,
    role: userRole
  }).select().maybeSingle();

  if (error) return fail(res, error);

  const token = jwt.sign(publicUser(user), jwtSecret, { expiresIn: '12h' });
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const { data: user, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
  if (error || !user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(publicUser(user), jwtSecret, { expiresIn: '12h' });
  res.json({ token, user: publicUser(user) });
});

router.get('/auth/me', auth, (req, res) => res.json({ user: req.user }));

// ── Dashboard Endpoint
router.get('/dashboard', auth, async (req, res) => {
  const [customers, products, challans, lowStock] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('sales_challans').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('products').select('id', { count: 'exact', head: true }).filter('current_stock', 'lte', 'min_stock_alert')
  ]);

  res.json({
    customers: customers.count || 0,
    products: products.count || 0,
    confirmedChallans: challans.count || 0,
    lowStock: lowStock.count || 0
  });
});

// ── Customer CRM Endpoints
router.get('/customers', auth, async (req, res) => {
  const search = String(req.query.search || '').trim();
  let query = supabase.from('customers').select('*, follow_ups(id,note,follow_up_date,created_at)').order('created_at', { ascending: false });
  if (search) {
    query = query.or(`name.ilike.%${search}%,business_name.ilike.%${search}%,mobile.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) return fail(res, error);
  res.json(data || []);
});

router.post('/customers', auth, roles('admin', 'sales'), async (req, res) => {
  const payload = { ...req.body, created_by: req.user.id };
  const { data, error } = await supabase.from('customers').insert(payload).select().maybeSingle();
  if (error) return fail(res, error);
  res.status(201).json(data);
});

router.put('/customers/:id', auth, roles('admin', 'sales'), async (req, res) => {
  const { data, error } = await supabase.from('customers').update(req.body).eq('id', req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  res.json(data);
});

router.post('/customers/:id/follow-ups', auth, roles('admin', 'sales'), async (req, res) => {
  const { note, follow_up_date } = req.body || {};
  if (!note) return res.status(400).json({ error: 'Note is required' });

  const { data, error } = await supabase.from('follow_ups').insert({
    customer_id: req.params.id,
    note,
    follow_up_date: follow_up_date || null,
    created_by: req.user.id
  }).select().maybeSingle();

  if (error) return fail(res, error);
  res.status(201).json(data);
});

// ── Inventory & Products Endpoints
router.get('/products', auth, async (req, res) => {
  const search = String(req.query.search || '').trim();
  let query = supabase.from('products').select('*').order('name');
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) return fail(res, error);
  res.json(data || []);
});

router.post('/products', auth, roles('admin', 'warehouse'), async (req, res) => {
  const { opening_stock = 0, ...product } = req.body;
  const { data, error } = await supabase.from('products').insert({ ...product, current_stock: 0 }).select().maybeSingle();
  if (error) return fail(res, error);

  if (Number(opening_stock) > 0) {
    await supabase.from('stock_movements').insert({
      product_id: data.id,
      quantity_change: Number(opening_stock),
      movement_type: 'IN',
      reason: 'Opening stock',
      created_by: req.user.id
    });
  }

  res.status(201).json(data);
});

router.put('/products/:id', auth, roles('admin', 'warehouse'), async (req, res) => {
  const { data, error } = await supabase.from('products').update(req.body).eq('id', req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  res.json(data);
});

router.post('/products/:id/movements', auth, roles('admin', 'warehouse'), async (req, res) => {
  const { quantity_change, movement_type, reason } = req.body || {};
  const quantity = Number(quantity_change);

  if (!quantity || !['IN', 'OUT'].includes(movement_type)) {
    return res.status(400).json({ error: 'Valid quantity and movement type are required' });
  }

  const { data: product } = await supabase.from('products').select('current_stock').eq('id', req.params.id).maybeSingle();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (movement_type === 'OUT' && product.current_stock < quantity) {
    return res.status(400).json({ error: `Only ${product.current_stock} units are available` });
  }

  const { data, error } = await supabase.from('stock_movements').insert({
    product_id: req.params.id,
    quantity_change: quantity,
    movement_type,
    reason,
    created_by: req.user.id
  }).select().maybeSingle();

  if (error) return fail(res, error);
  res.status(201).json(data);
});

router.get('/stock-movements', auth, async (req, res) => {
  const { data, error } = await supabase.from('stock_movements')
    .select('*, products(name,sku), users(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return fail(res, error);
  res.json(data || []);
});

// ── Sales Challans Endpoints
router.get('/challans', auth, async (req, res) => {
  const { data, error } = await supabase.from('sales_challans')
    .select('*, customers(name,business_name), challan_items(*)')
    .order('created_at', { ascending: false });

  if (error) return fail(res, error);
  res.json(data || []);
});

router.post('/challans', auth, roles('admin', 'sales'), async (req, res) => {
  const { customer_id, items, status = 'draft' } = req.body || {};
  if (!customer_id || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Customer and at least one product are required' });
  }

  const ids = items.map((item) => item.product_id);
  const { data: products, error: productsError } = await supabase.from('products').select('*').in('id', ids);
  if (productsError) return fail(res, productsError);

  try {
    const snapshots = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || Number(item.quantity) < 1) throw new Error('Each product and quantity must be valid');
      return {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: product.unit_price,
        quantity: Number(item.quantity)
      };
    });

    const challanNumber = `CH${new Date().toISOString().slice(0, 7).replace('-', '')}${String(Date.now()).slice(-5)}`;
    const { data: challan, error } = await supabase.from('sales_challans').insert({
      challan_number: challanNumber,
      customer_id,
      status: 'draft',
      total_quantity: snapshots.reduce((sum, item) => sum + item.quantity, 0),
      created_by: req.user.id
    }).select().maybeSingle();

    if (error) return fail(res, error);

    const { error: itemError } = await supabase.from('challan_items').insert(
      snapshots.map((item) => ({ ...item, challan_id: challan.id }))
    );
    if (itemError) return fail(res, itemError);

    if (status === 'confirmed') {
      return confirmChallan(challan.id, req.user, res);
    }

    res.status(201).json({ ...challan, challan_items: snapshots });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

async function confirmChallan(id, user, res) {
  const { data: challan } = await supabase.from('sales_challans').select('*, challan_items(*)').eq('id', id).maybeSingle();
  if (!challan) return res.status(404).json({ error: 'Challan not found' });
  if (challan.status !== 'draft') return res.status(400).json({ error: 'Only draft challans can be confirmed' });

  for (const item of challan.challan_items) {
    const { data: product } = await supabase.from('products').select('current_stock').eq('id', item.product_id).maybeSingle();
    if (!product || product.current_stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${item.product_name}` });
    }
  }

  for (const item of challan.challan_items) {
    const { error } = await supabase.from('stock_movements').insert({
      product_id: item.product_id,
      quantity_change: item.quantity,
      movement_type: 'OUT',
      reason: `Sales challan ${challan.challan_number}`,
      created_by: user.id
    });
    if (error) return fail(res, error);
  }

  const { data, error } = await supabase.from('sales_challans').update({ status: 'confirmed' }).eq('id', id).select().maybeSingle();
  if (error) return fail(res, error);
  res.json(data);
}

router.post('/challans/:id/confirm', auth, roles('admin', 'sales'), (req, res) => confirmChallan(req.params.id, req.user, res));

router.post('/challans/:id/cancel', auth, roles('admin', 'sales'), async (req, res) => {
  const { data: challan } = await supabase.from('sales_challans').select('*').eq('id', req.params.id).maybeSingle();
  if (!challan) return res.status(404).json({ error: 'Challan not found' });
  if (challan.status !== 'draft') return res.status(400).json({ error: 'Only draft challans can be cancelled' });

  const { data, error } = await supabase.from('sales_challans').update({ status: 'cancelled' }).eq('id', req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  res.json(data);
});

// Mount router at both '/api' and '/'
app.use('/api', router);
app.use(router);

// Guard: Unmatched API routes must return JSON, never HTML
app.all('/api/*', (req, res) => res.status(404).json({ error: 'API route not found' }));

// Client fallback routing (for standalone node server)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Server startup
seed().catch((error) => console.error('Seed notice:', error.message || error));

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`ERP-CRM server listening on port ${port}`));
}

export default app;
