import { useState } from 'react';
import { api, label } from '../lib/api';

export default function CustomerDetail({ customer, canEdit, onEdit, close }) {
  const [note, setNote] = useState('');
  const [followUps, setFollowUps] = useState(customer.follow_ups || []);
  const addNote = async () => {
    if (!note.trim()) return;
    const added = await api(`/customers/${customer.id}/follow-ups`, { method: 'POST', body: JSON.stringify({ note }) });
    setFollowUps([added, ...followUps]);
    setNote('');
  };
  return <div className="modal-backdrop"><div className="modal">
    <div className="form-header"><div><div className="eyebrow">CUSTOMER DETAIL</div><h2>{customer.name}</h2></div><button className="icon-button" onClick={close}>×</button></div>
    <div className="detail-grid"><div><span>Business</span><b>{customer.business_name || '—'}</b></div><div><span>Mobile</span><b>{customer.mobile}</b></div><div><span>Email</span><b>{customer.email || '—'}</b></div><div><span>GST Number</span><b>{customer.gst_number || '—'}</b></div><div><span>Customer Type</span><b>{label(customer.customer_type)}</b></div><div><span>Status</span><b>{label(customer.status)}</b></div><div style={{ gridColumn: 'span 2' }}><span>Address</span><b>{customer.address || '—'}</b></div>{customer.notes && <div style={{ gridColumn: 'span 2' }}><span>Notes</span><b>{customer.notes}</b></div>}</div>
    {canEdit && <div style={{ marginBottom: '16px' }}><button className="button" onClick={onEdit}>✏ Edit details</button></div>}
    <hr /><h3>Follow-up history</h3>{followUps.map((item) => <div className="note" key={item.id}><b>{item.note}</b><span>{new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>)}{!followUps.length && <p className="muted" style={{ fontSize: '12px' }}>No follow-up notes recorded yet.</p>}
    {canEdit && <div className="note-entry"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a new follow-up note…" /><button className="button primary" onClick={addNote}>Add note</button></div>}
  </div></div>;
}
