import { label } from '../lib/api';

export default function Sidebar({ page, setPage, user, logout }) {
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
        <div><strong>ERP-CRM</strong><span>Operations portal</span></div>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {navItems.map(([id, text, icon]) => (
          <button key={id} className={page === id ? 'nav-item active' : 'nav-item'} onClick={() => setPage(id)}>
            <span>{icon}</span>{text}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="avatar">{user.name.split(' ').map((name) => name[0]).join('')}</div>
          <div><b>{user.name}</b><span>{label(user.role)}</span></div>
          <button className="sidebar-logout" onClick={logout} title="Sign out of account">Sign out</button>
        </div>
      </div>
    </aside>
  );
}
