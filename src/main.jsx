import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { api, label, TOKEN_KEY } from './lib/api';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Customers from './components/Customers';
import Inventory from './components/Inventory';
import Challans from './components/Challans';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('northstar_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then((result) => setUser(result.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('northstar_token');
      })
      .finally(() => setLoading(false));
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
          <div className="mobile-title"><span className="brand-mark small">EC</span>ERP-CRM</div>
          <div className="topbar-actions">
            <div className="avatar" title={`${user.name} (${label(user.role)})`}>{user.name.split(' ').map((name) => name[0]).join('')}</div>
            <div className="topbar-user-info"><b>{user.name}</b><span>{label(user.role)}</span></div>
            <button className="logout-btn" onClick={logout} title="Sign out of your account">Sign out ⎋</button>
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

createRoot(document.getElementById('root')).render(<App />);
