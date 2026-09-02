import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// ── API Fetcher Utility ──────────────────────────────────────
const TOKEN_KEY = 'erpcrm_token';

const api = async (url, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('northstar_token');
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Server returned an unexpected response. Please ensure backend is running.');
  }

  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const label = (value) => String(value || '').replaceAll('_', ' ');

// ── Auth Component (Login & Sign Up) ──────────────────────────
function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@northstar.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('sales');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login';
      const payload = mode === 'signup'
        ? { name, email, password, role }
        : { email, password };

      const result = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      localStorage.setItem(TOKEN_KEY, result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-brand">
        <div className="brand-mark">EC</div>
        <div>
          <strong>ERP-CRM</strong>
          <span>Operations portal</span>
        </div>
      </div>
      <div className="login-card">
        <div className="eyebrow">{mode === 'signup' ? 'NEW USER REGISTRATION' : 'TEAM SIGN IN'}</div>
        <h1>{mode === 'signup' ? 'Create an account.' : 'Run the day with clarity.'}</h1>
        <p className="muted">
          {mode === 'signup'
            ? 'Join the workspace with your name, work email, and role.'
            : 'Manage customers, stock, and sales from one calm workspace.'}
        </p>

        <div className="tabs" style={{ marginBottom: '18px', width: '100%', display: 'flex' }}>
          <button
            type="button"
            className={mode === 'login' ? 'tab-button active' : 'tab-button'}
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'tab-button active' : 'tab-button'}
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign Up (Register)
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label>
                Full name *
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Assigned Role *
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="sales">Sales Team</option>
                  <option value="warehouse">Warehouse Team</option>
                  <option value="accounts">Accounts Team</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
            </>
          )}

          <label>
            Work email *
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password *
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="button primary full" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : (mode === 'signup' ? 'Create Account & Sign In' : 'Sign in to workspace')}
          </button>
        </form>

        {mode === 'login' ? (
          <p className="demo-hint">
            Demo credentials: <b>password123</b>
            <br />
            <code>admin@northstar.com</code> · <code>sales@northstar.com</code>
          </p>
        ) : (
          <p className="demo-hint">
            Accounts are saved securely in your Supabase database with encrypted passwords.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main App Shell ───────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('northstar_token');
    if (savedToken) {
      api('/auth/me')
        .then((result) => setUser(result.user))
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('northstar_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="loading">Loading workspace…</div>;
  if (!user) return <Login onLogin={setUser} />;

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('northstar_token');
    setUser(null);
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} user={user} logout={logout} />
      <main className="main">
        <header className="topbar">
          <div className="mobile-title">
            <span className="brand-mark small">EC</span>ERP-CRM
          </div>
          <div className="topbar-actions">
            <div className="avatar" title={`${user.name} (${label(user.role)})`}>
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="topbar-user-info">
              <b>{user.name}</b>
              <span>{label(user.role)}</span>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign out of your account">
              Sign out ⎋
            </button>
          </div>
        </header>
        <div className="page-content">
          {page === 'overview' && <Overview setPage={setPage} />}
          {page === 'customers' && <Customers user={user} />}
          {page === 'inventory' && <Inventory user={user} />}
          {page === 'challans' && <Challans user={user} />}
        </div>
      </main>
    </div>
  );
}

// ── Sidebar Navigation ───────────────────────────────────────
function Sidebar({ page, setPage, user, logout }) {
  const navItems = [
    ['overview', 'Overview', '⌂'],
    ['customers', 'Customers', '◉'],
    ['inventory', 'Inventory & Stock', '▦'],
    ['challans', 'Sales Challans', '◫']
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">EC</div>
        <div>
          <strong>ERP-CRM</strong>
          <span>Operations portal</span>
        </div>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {navItems.map(([id, text, icon]) => (
          <button
            key={id}
            className={page === id ? 'nav-item active' : 'nav-item'}
            onClick={() => setPage(id)}
          >
            <span>{icon}</span>
            {text}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="avatar">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <b>{user.name}</b>
            <span>{label(user.role)}</span>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Sign out of account">
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Overview Page ────────────────────────────────────────────
function Overview({ setPage }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/dashboard').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="loading">Preparing your overview…</div>;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DASHBOARD & OVERVIEW</div>
          <h1>Good day, team.</h1>
          <p className="muted">Here’s what needs your attention today.</p>
        </div>
        <button className="button primary" onClick={() => setPage('challans')}>
          + New challan
        </button>
      </div>

      <div className="stats-grid">
        <Stat title="Total customers" value={stats.customers} hint="Across all segments" icon="◉" tone="blue" />
        <Stat title="Products tracked" value={stats.products} hint="In your catalog" icon="▦" tone="green" />
        <Stat title="Confirmed challans" value={stats.confirmedChallans} hint="Stock dispatched" icon="◫" tone="orange" />
        <Stat title="Low stock alerts" value={stats.lowStock} hint="Need attention" icon="!" tone="red" />
      </div>

      <div className="overview-grid">
        <div className="panel welcome-panel">
          <div className="eyebrow">CONTROL CENTER</div>
          <h2>Everything in its place.</h2>
          <p>Keep customer conversations, warehouse movement, and dispatches moving without switching tools.</p>
          <div className="quick-actions">
            <button onClick={() => setPage('customers')}>
              <span>◉</span>
              <b>Add a customer</b>
              <small>Capture a new relationship</small>
              <i>→</i>
            </button>
            <button onClick={() => setPage('inventory')}>
              <span>▦</span>
              <b>Update stock</b>
              <small>Record an incoming shipment</small>
              <i>→</i>
            </button>
            <button onClick={() => setPage('challans')}>
              <span>◫</span>
              <b>Create challan</b>
              <small>Prepare a customer dispatch</small>
              <i>→</i>
            </button>
          </div>
        </div>

        <div className="panel attention-panel">
          <div className="panel-heading">
            <div>
              <h3>Attention needed</h3>
              <p className="muted">Small things worth a look</p>
            </div>
            <span className="alert-icon">!</span>
          </div>
          <div className="attention-item">
            <div className="attention-badge red">!</div>
            <div>
              <b>{stats.lowStock} products below minimum</b>
              <span>Review inventory levels</span>
            </div>
            <button onClick={() => setPage('inventory')}>View →</button>
          </div>
          <div className="attention-item">
            <div className="attention-badge blue">◷</div>
            <div>
              <b>Follow-ups keep deals moving</b>
              <span>Check your customer pipeline</span>
            </div>
            <button onClick={() => setPage('customers')}>View →</button>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ title, value, hint, icon, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}

// ── Customers CRM Component ──────────────────────────────────
function Customers({ user }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selected, setSelected] = useState(null);
  const canEdit = ['admin', 'sales'].includes(user.role);

  const load = () => {
    api(`/customers?search=${encodeURIComponent(search)}`)
      .then(setCustomers)
      .catch(console.error);
  };

  useEffect(load, [search]);

  const save = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.target));
    if (editingCustomer) {
      await api(`/customers/${editingCustomer.id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      setEditingCustomer(null);
    } else {
      await api('/customers', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setShowForm(false);
    }
    load();
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CUSTOMER RELATIONSHIPS</div>
          <h1>Customers</h1>
          <p className="muted">Build relationships that last.</p>
        </div>
        {canEdit && (
          <button className="button primary" onClick={() => { setEditingCustomer(null); setShowForm(true); }}>
            + Add customer
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          ⌕
          <input
            placeholder="Search name, business, mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="result-count">{customers.length} customers</span>
      </div>

      {(showForm || editingCustomer) && (
        <div className="panel form-panel">
          <form onSubmit={save}>
            <div className="form-header">
              <h3>{editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'New customer'}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => { setShowForm(false); setEditingCustomer(null); }}
              >
                ×
              </button>
            </div>
            <div className="form-grid">
              <label>
                Name *
                <input name="name" required defaultValue={editingCustomer?.name || ''} />
              </label>
              <label>
                Mobile *
                <input name="mobile" required defaultValue={editingCustomer?.mobile || ''} />
              </label>
              <label>
                Email
                <input name="email" type="email" defaultValue={editingCustomer?.email || ''} />
              </label>
              <label>
                Business name
                <input name="business_name" defaultValue={editingCustomer?.business_name || ''} />
              </label>
              <label>
                Customer type
                <select name="customer_type" defaultValue={editingCustomer?.customer_type || 'retail'}>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="distributor">Distributor</option>
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={editingCustomer?.status || 'lead'}>
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                Follow-up date
                <input name="follow_up_date" type="date" defaultValue={editingCustomer?.follow_up_date || ''} />
              </label>
              <label>
                GST number
                <input name="gst_number" defaultValue={editingCustomer?.gst_number || ''} />
              </label>
              <label className="wide">
                Address
                <input name="address" defaultValue={editingCustomer?.address || ''} />
              </label>
              <label className="wide">
                Notes
                <textarea name="notes" rows="3" defaultValue={editingCustomer?.notes || ''}></textarea>
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button"
                onClick={() => { setShowForm(false); setEditingCustomer(null); }}
              >
                Cancel
              </button>
              <button className="button primary">
                {editingCustomer ? 'Update customer' : 'Save customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Follow-up</th>
              <th>Contact</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <div className="table-person">
                    <div className="avatar pale">{customer.name[0]}</div>
                    <div>
                      <b>{customer.name}</b>
                      <span>{customer.business_name || 'Independent customer'}</span>
                    </div>
                  </div>
                </td>
                <td><span className="tag">{label(customer.customer_type)}</span></td>
                <td><span className={`status ${customer.status}`}>{label(customer.status)}</span></td>
                <td>
                  {customer.follow_up_date
                    ? new Date(customer.follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                    : '—'}
                </td>
                <td>{customer.mobile}</td>
                <td>
                  <div className="table-actions">
                    <button className="text-button" onClick={() => setSelected(customer)}>
                      View
                    </button>
                    {canEdit && (
                      <button
                        className="text-button"
                        onClick={() => { setShowForm(false); setEditingCustomer(customer); }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!customers.length && <Empty text="No customers yet" />}
      </div>

      {selected && (
        <CustomerDetail
          customer={selected}
          canEdit={canEdit}
          onEdit={() => { setSelected(null); setEditingCustomer(selected); }}
          close={() => setSelected(null)}
        />
      )}
    </>
  );
}

function CustomerDetail({ customer, canEdit, onEdit, close }) {
  const [note, setNote] = useState('');
  const [followUps, setFollowUps] = useState(customer.follow_ups || []);

  const addNote = async () => {
    if (!note.trim()) return;
    const added = await api(`/customers/${customer.id}/follow-ups`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    setFollowUps([added, ...followUps]);
    setNote('');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="form-header">
          <div>
            <div className="eyebrow">CUSTOMER DETAIL</div>
            <h2>{customer.name}</h2>
          </div>
          <button className="icon-button" onClick={close}>×</button>
        </div>
        <div className="detail-grid">
          <div><span>Business</span><b>{customer.business_name || '—'}</b></div>
          <div><span>Mobile</span><b>{customer.mobile}</b></div>
          <div><span>Email</span><b>{customer.email || '—'}</b></div>
          <div><span>GST Number</span><b>{customer.gst_number || '—'}</b></div>
          <div><span>Customer Type</span><b>{label(customer.customer_type)}</b></div>
          <div><span>Status</span><b>{label(customer.status)}</b></div>
          <div style={{ gridColumn: 'span 2' }}><span>Address</span><b>{customer.address || '—'}</b></div>
          {customer.notes && <div style={{ gridColumn: 'span 2' }}><span>Notes</span><b>{customer.notes}</b></div>}
        </div>

        {canEdit && (
          <div style={{ marginBottom: '16px' }}>
            <button className="button" onClick={onEdit}>✏ Edit details</button>
          </div>
        )}

        <hr />
        <h3>Follow-up history</h3>
        {followUps.map((item) => (
          <div className="note" key={item.id}>
            <b>{item.note}</b>
            <span>{new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        ))}
        {!followUps.length && <p className="muted" style={{ fontSize: '12px' }}>No follow-up notes recorded yet.</p>}

        {canEdit && (
          <div className="note-entry">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a new follow-up note…"
            />
            <button className="button primary" onClick={addNote}>
              Add note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inventory & Stock Module ─────────────────────────────────
function Inventory({ user }) {
  const [tab, setTab] = useState('products'); // 'products' | 'movements'
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);

  const canEdit = ['admin', 'warehouse'].includes(user.role);

  const loadProducts = () => {
    api(`/products?search=${encodeURIComponent(search)}`)
      .then(setProducts)
      .catch(console.error);
  };

  const loadMovements = () => {
    api('/stock-movements')
      .then(setMovements)
      .catch(console.error);
  };

  useEffect(() => {
    if (tab === 'products') loadProducts();
    if (tab === 'movements') loadMovements();
  }, [search, tab]);

  const saveProduct = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.target));
    if (editingProduct) {
      await api(`/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      setEditingProduct(null);
    } else {
      await api('/products', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setShowForm(false);
    }
    loadProducts();
  };

  const recordMovement = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const productId = formData.get('product_id');
    const movement_type = formData.get('movement_type');
    const quantity_change = Number(formData.get('quantity_change'));
    const reason = formData.get('reason');

    await api(`/products/${productId}/movements`, {
      method: 'POST',
      body: JSON.stringify({ movement_type, quantity_change, reason })
    });

    setShowAdjustModal(false);
    setAdjustTarget(null);
    loadProducts();
    if (tab === 'movements') loadMovements();
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WAREHOUSE & STOCK CONTROL</div>
          <h1>Inventory</h1>
          <p className="muted">Track catalog products, real-time stock levels, and audit logs.</p>
        </div>
        {canEdit && (
          <div className="header-actions">
            <button className="button" onClick={() => { setAdjustTarget(null); setShowAdjustModal(true); }}>
              ⇄ Adjust stock
            </button>
            <button className="button primary" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
              + Add product
            </button>
          </div>
        )}
      </div>

      <div className="tabs">
        <button
          className={tab === 'products' ? 'tab-button active' : 'tab-button'}
          onClick={() => setTab('products')}
        >
          Product Catalog ({products.length})
        </button>
        <button
          className={tab === 'movements' ? 'tab-button active' : 'tab-button'}
          onClick={() => setTab('movements')}
        >
          Stock Movement Log
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="toolbar">
            <div className="search">
              ⌕
              <input
                placeholder="Search product, SKU, category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="result-count">{products.length} products</span>
          </div>

          {(showForm || editingProduct) && (
            <div className="panel form-panel">
              <form onSubmit={saveProduct}>
                <div className="form-header">
                  <h3>{editingProduct ? `Edit Product: ${editingProduct.name}` : 'New product'}</h3>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => { setShowForm(false); setEditingProduct(null); }}
                  >
                    ×
                  </button>
                </div>
                <div className="form-grid">
                  <label>
                    Product name *
                    <input name="name" required defaultValue={editingProduct?.name || ''} />
                  </label>
                  <label>
                    SKU / Code *
                    <input name="sku" required defaultValue={editingProduct?.sku || ''} />
                  </label>
                  <label>
                    Category
                    <input name="category" defaultValue={editingProduct?.category || ''} />
                  </label>
                  <label>
                    Unit price (₹)
                    <input
                      name="unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={editingProduct?.unit_price || ''}
                    />
                  </label>
                  {!editingProduct && (
                    <label>
                      Opening stock
                      <input name="opening_stock" type="number" min="0" defaultValue="0" />
                    </label>
                  )}
                  <label>
                    Minimum alert quantity
                    <input
                      name="min_stock_alert"
                      type="number"
                      min="0"
                      defaultValue={editingProduct?.min_stock_alert || '10'}
                    />
                  </label>
                  <label className="wide">
                    Warehouse / location
                    <input name="location" defaultValue={editingProduct?.location || 'Warehouse A'} />
                  </label>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => { setShowForm(false); setEditingProduct(null); }}
                  >
                    Cancel
                  </button>
                  <button className="button primary">
                    {editingProduct ? 'Update product' : 'Save product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="panel table-panel">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Current Stock</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLow = product.current_stock <= product.min_stock_alert;
                  return (
                    <tr key={product.id}>
                      <td><b>{product.name}</b></td>
                      <td><code>{product.sku}</code></td>
                      <td>{product.category || '—'}</td>
                      <td>{money(product.unit_price)}</td>
                      <td>
                        <span className={isLow ? 'stock low' : 'stock'}>
                          {product.current_stock} <small>units</small>
                        </span>
                        {isLow && <span className="status inactive" style={{ marginLeft: '8px' }}>Low</span>}
                      </td>
                      <td>{product.location || '—'}</td>
                      <td>
                        <div className="table-actions">
                          {canEdit && (
                            <>
                              <button
                                className="text-button"
                                onClick={() => { setAdjustTarget(product); setShowAdjustModal(true); }}
                              >
                                Adjust
                              </button>
                              <button
                                className="text-button"
                                onClick={() => { setShowForm(false); setEditingProduct(product); }}
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!products.length && <Empty text="No products yet" />}
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="panel table-panel">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Movement</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Logged By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.products?.name || 'Product'}</b>
                    <span className="subtext"><code>{item.products?.sku}</code></span>
                  </td>
                  <td>
                    <span className={`movement-badge ${item.movement_type.toLowerCase()}`}>
                      {item.movement_type === 'IN' ? '↓ IN' : '↑ OUT'}
                    </span>
                  </td>
                  <td>
                    <b style={{ color: item.movement_type === 'IN' ? 'var(--green)' : 'var(--red)' }}>
                      {item.movement_type === 'IN' ? `+${item.quantity_change}` : `-${item.quantity_change}`}
                    </b>
                  </td>
                  <td>{item.reason || '—'}</td>
                  <td>{item.users?.name || 'System / Admin'}</td>
                  <td>
                    {new Date(item.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!movements.length && <Empty text="No stock movements recorded yet" />}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="form-header">
              <h3>Record Stock Movement</h3>
              <button
                className="icon-button"
                onClick={() => { setShowAdjustModal(false); setAdjustTarget(null); }}
              >
                ×
              </button>
            </div>
            <form onSubmit={recordMovement}>
              <label>
                Product *
                <select
                  name="product_id"
                  required
                  defaultValue={adjustTarget?.id || ''}
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.current_stock}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-grid" style={{ marginTop: '12px' }}>
                <label>
                  Movement Type *
                  <select name="movement_type" defaultValue="IN">
                    <option value="IN">IN (Received shipment / Stock addition)</option>
                    <option value="OUT">OUT (Dispatched / Damaged / Deduction)</option>
                  </select>
                </label>
                <label>
                  Quantity Changed *
                  <input name="quantity_change" type="number" min="1" required defaultValue="1" />
                </label>
              </div>

              <label style={{ marginTop: '12px' }}>
                Reason / Note *
                <input
                  name="reason"
                  required
                  placeholder="e.g. Received new shipment, Damaged goods, Audit adjustment"
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => { setShowAdjustModal(false); setAdjustTarget(null); }}
                >
                  Cancel
                </button>
                <button className="button primary">Confirm Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sales Challans Module ────────────────────────────────────
function Challans({ user }) {
  const [challans, setChallans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([]);
  const [viewingChallan, setViewingChallan] = useState(null);
  const canEdit = ['admin', 'sales'].includes(user.role);

  const load = () => {
    Promise.all([
      api('/challans').then(setChallans),
      api('/customers').then(setCustomers),
      api('/products').then(setProducts)
    ]).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = () => {
    const product = products.find((item) => item.id === selectedProduct);
    if (product && !items.find((item) => item.product_id === product.id)) {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          unit_price: product.unit_price,
          quantity: 1
        }
      ]);
    }
    setSelectedProduct('');
  };

  const create = async (status) => {
    if (!customer || !items.length) {
      alert('Please select a customer and at least one product.');
      return;
    }
    try {
      await api('/challans', {
        method: 'POST',
        body: JSON.stringify({ customer_id: customer, items, status })
      });
      setItems([]);
      setCustomer('');
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const confirm = async (id) => {
    try {
      await api(`/challans/${id}/confirm`, { method: 'POST' });
      load();
      if (viewingChallan) setViewingChallan(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const cancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this draft challan?')) return;
    try {
      await api(`/challans/${id}/cancel`, { method: 'POST' });
      load();
      if (viewingChallan) setViewingChallan(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DISPATCH & ORDER OPERATIONS</div>
          <h1>Sales Challans</h1>
          <p className="muted">Prepare, confirm, and track every customer dispatch order.</p>
        </div>
        {canEdit && (
          <button className="button primary" onClick={() => setShowForm(true)}>
            + New challan
          </button>
        )}
      </div>

      {showForm && (
        <div className="panel form-panel">
          <div className="form-header">
            <h3>Create Sales Challan</h3>
            <button className="icon-button" onClick={() => setShowForm(false)}>×</button>
          </div>
          <label>
            Customer *
            <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · {item.business_name || 'Personal'} ({label(item.customer_type)})
                </option>
              ))}
            </select>
          </label>

          <div className="add-product-row">
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
              <option value="">Add products</option>
              {products.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · {money(item.unit_price)} (Available: {item.current_stock})
                </option>
              ))}
            </select>
            <button className="button" type="button" onClick={addItem}>+ Add Line Item</button>
          </div>

          {items.map((item, index) => (
            <div className="line-item" key={item.product_id}>
              <div>
                <b>{item.product_name}</b>
                <span className="subtext">{money(item.unit_price)} each</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Qty:</span>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems(
                      items.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, quantity: Number(e.target.value) } : row
                      )
                    )
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => setItems(items.filter((row) => row.product_id !== item.product_id))}
              >
                ×
              </button>
            </div>
          ))}

          <div className="form-actions">
            <button className="button" type="button" onClick={() => create('draft')}>
              Save as Draft
            </button>
            <button className="button primary" type="button" onClick={() => create('confirmed')}>
              Save & Confirm Dispatch
            </button>
          </div>
        </div>
      )}

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {challans.map((item) => (
              <tr key={item.id}>
                <td><code>{item.challan_number}</code></td>
                <td>
                  <b>{item.customers?.name || '—'}</b>
                  <span className="subtext">{item.customers?.business_name}</span>
                </td>
                <td>{item.challan_items?.length || 0} products</td>
                <td><b>{item.total_quantity}</b></td>
                <td><span className={`status ${item.status}`}>{label(item.status)}</span></td>
                <td>
                  {new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td>
                  <div className="table-actions">
                    <button className="text-button" onClick={() => setViewingChallan(item)}>
                      View
                    </button>
                    {item.status === 'draft' && canEdit && (
                      <>
                        <button className="text-button" onClick={() => confirm(item.id)}>
                          Confirm
                        </button>
                        <button className="text-button danger" onClick={() => cancel(item.id)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!challans.length && <Empty text="No challans yet" />}
      </div>

      {/* View Challan Detail Modal */}
      {viewingChallan && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="form-header">
              <div>
                <div className="eyebrow">SALES CHALLAN</div>
                <h2>{viewingChallan.challan_number}</h2>
              </div>
              <button className="icon-button" onClick={() => setViewingChallan(null)}>×</button>
            </div>

            <div className="detail-grid">
              <div><span>Customer</span><b>{viewingChallan.customers?.name || '—'}</b></div>
              <div><span>Business</span><b>{viewingChallan.customers?.business_name || '—'}</b></div>
              <div><span>Status</span><b className={`status ${viewingChallan.status}`}>{label(viewingChallan.status)}</b></div>
              <div><span>Total Quantity</span><b>{viewingChallan.total_quantity} units</b></div>
              <div>
                <span>Created Date</span>
                <b>{new Date(viewingChallan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</b>
              </div>
            </div>

            <hr />
            <h3>Product Snapshot Items</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(viewingChallan.challan_items || []).map((line) => (
                  <tr key={line.id}>
                    <td><b>{line.product_name}</b></td>
                    <td><code>{line.product_sku}</code></td>
                    <td>{money(line.unit_price)}</td>
                    <td><b>{line.quantity}</b></td>
                    <td>{money((line.unit_price || 0) * (line.quantity || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              {viewingChallan.status === 'draft' && canEdit && (
                <>
                  <button className="button danger" onClick={() => cancel(viewingChallan.id)}>
                    Cancel Challan
                  </button>
                  <button className="button primary" onClick={() => confirm(viewingChallan.id)}>
                    Confirm Dispatch
                  </button>
                </>
              )}
              <button className="button" onClick={() => setViewingChallan(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      {text}
      <span>Create your first record to see it here.</span>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
