import { useState } from 'react';
import { api, TOKEN_KEY } from '../lib/api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
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
      const payload = mode === 'signup' ? { name, email, password, role } : { email, password };
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
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
        <div><strong>ERP-CRM</strong><span>Operations portal</span></div>
      </div>
      <div className="login-card">
        <div className="eyebrow">{mode === 'signup' ? 'NEW USER REGISTRATION' : 'TEAM SIGN IN'}</div>
        <h1>{mode === 'signup' ? 'Create an account.' : 'Run the day with clarity.'}</h1>
        <p className="muted">{mode === 'signup' ? 'Join the workspace with your name, work email, and role.' : 'Manage customers, stock, and sales from one calm workspace.'}</p>
        <div className="tabs" style={{ marginBottom: '18px', width: '100%', display: 'flex' }}>
          <button type="button" className={mode === 'login' ? 'tab-button active' : 'tab-button'} style={{ flex: 1, textAlign: 'center' }} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          <button type="button" className={mode === 'signup' ? 'tab-button active' : 'tab-button'} style={{ flex: 1, textAlign: 'center' }} onClick={() => { setMode('signup'); setError(''); }}>Sign Up (Register)</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'signup' && <>
            <label>Full name *<input type="text" required placeholder="e.g. Vikram Sharma" value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Assigned Role *<select value={role} onChange={(e) => setRole(e.target.value)}><option value="sales">Sales Team</option><option value="warehouse">Warehouse Team</option><option value="accounts">Accounts Team</option><option value="admin">Administrator</option></select></label>
          </>}
          <label>Work email *<input type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password *<input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <div className="error-box">{error}</div>}
          <button className="button primary full" disabled={loading} style={{ marginTop: '8px' }}>{loading ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : (mode === 'signup' ? 'Create Account & Sign In' : 'Sign in to workspace')}</button>
        </form>
        {mode === 'login' ? <p className="demo-hint">Demo credentials: <b>password123</b><br /><code>admin@northstar.com</code> · <code>sales@northstar.com</code></p> : <p className="demo-hint">Accounts are saved securely in your Supabase database with encrypted passwords.</p>}
      </div>
    </div>
  );
}
