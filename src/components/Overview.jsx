import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Stat from './Stat';

export default function Overview({ setPage }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/dashboard').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="loading">Preparing your overview…</div>;

  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">DASHBOARD & OVERVIEW</div><h1>Good day, team.</h1><p className="muted">Here’s what needs your attention today.</p></div><button className="button primary" onClick={() => setPage('challans')}>+ New challan</button></div>
      <div className="stats-grid">
        <Stat title="Total customers" value={stats.customers} hint="Across all segments" icon="◉" tone="blue" />
        <Stat title="Products tracked" value={stats.products} hint="In your catalog" icon="▦" tone="green" />
        <Stat title="Confirmed challans" value={stats.confirmedChallans} hint="Stock dispatched" icon="◫" tone="orange" />
        <Stat title="Low stock alerts" value={stats.lowStock} hint="Need attention" icon="!" tone="red" />
      </div>
      <div className="overview-grid">
        <div className="panel welcome-panel"><div className="eyebrow">CONTROL CENTER</div><h2>Everything in its place.</h2><p>Keep customer conversations, warehouse movement, and dispatches moving without switching tools.</p><div className="quick-actions">
          <button onClick={() => setPage('customers')}><span>◉</span><b>Add a customer</b><small>Capture a new relationship</small><i>→</i></button>
          <button onClick={() => setPage('inventory')}><span>▦</span><b>Update stock</b><small>Record an incoming shipment</small><i>→</i></button>
          <button onClick={() => setPage('challans')}><span>◫</span><b>Create challan</b><small>Prepare a customer dispatch</small><i>→</i></button>
        </div></div>
        <div className="panel attention-panel"><div className="panel-heading"><div><h3>Attention needed</h3><p className="muted">Small things worth a look</p></div><span className="alert-icon">!</span></div>
          <div className="attention-item"><div className="attention-badge red">!</div><div><b>{stats.lowStock} products below minimum</b><span>Review inventory levels</span></div><button onClick={() => setPage('inventory')}>View →</button></div>
          <div className="attention-item"><div className="attention-badge blue">◷</div><div><b>Follow-ups keep deals moving</b><span>Check your customer pipeline</span></div><button onClick={() => setPage('customers')}>View →</button></div>
        </div>
      </div>
    </>
  );
}
