import { useEffect, useState } from 'react';
import { api, label } from '../lib/api';
import Empty from './Empty';
import CustomerDetail from './CustomerDetail';

export default function Customers({ user }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selected, setSelected] = useState(null);
  const canEdit = ['admin', 'sales'].includes(user.role);
  const load = () => api(`/customers?search=${encodeURIComponent(search)}`).then(setCustomers).catch(console.error);
  useEffect(load, [search]);
  const save = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.target));
    if (editingCustomer) {
      await api(`/customers/${editingCustomer.id}`, { method: 'PUT', body: JSON.stringify(body) });
      setEditingCustomer(null);
    } else {
      await api('/customers', { method: 'POST', body: JSON.stringify(body) });
      setShowForm(false);
    }
    load();
  };
  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">CUSTOMER RELATIONSHIPS</div><h1>Customers</h1><p className="muted">Build relationships that last.</p></div>{canEdit && <button className="button primary" onClick={() => { setEditingCustomer(null); setShowForm(true); }}>+ Add customer</button>}</div>
      <div className="toolbar"><div className="search">⌕<input placeholder="Search name, business, mobile" value={search} onChange={(e) => setSearch(e.target.value)} /></div><span className="result-count">{customers.length} customers</span></div>
      {(showForm || editingCustomer) && <div className="panel form-panel"><form onSubmit={save}><div className="form-header"><h3>{editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'New customer'}</h3><button type="button" className="icon-button" onClick={() => { setShowForm(false); setEditingCustomer(null); }}>×</button></div><div className="form-grid">
        <label>Name *<input name="name" required defaultValue={editingCustomer?.name || ''} /></label><label>Mobile *<input name="mobile" required defaultValue={editingCustomer?.mobile || ''} /></label><label>Email<input name="email" type="email" defaultValue={editingCustomer?.email || ''} /></label><label>Business name<input name="business_name" defaultValue={editingCustomer?.business_name || ''} /></label>
        <label>Customer type<select name="customer_type" defaultValue={editingCustomer?.customer_type || 'retail'}><option value="retail">Retail</option><option value="wholesale">Wholesale</option><option value="distributor">Distributor</option></select></label><label>Status<select name="status" defaultValue={editingCustomer?.status || 'lead'}><option value="lead">Lead</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label>Follow-up date<input name="follow_up_date" type="date" defaultValue={editingCustomer?.follow_up_date || ''} /></label><label>GST number<input name="gst_number" defaultValue={editingCustomer?.gst_number || ''} /></label><label className="wide">Address<input name="address" defaultValue={editingCustomer?.address || ''} /></label><label className="wide">Notes<textarea name="notes" rows="3" defaultValue={editingCustomer?.notes || ''}></textarea></label>
      </div><div className="form-actions"><button type="button" className="button" onClick={() => { setShowForm(false); setEditingCustomer(null); }}>Cancel</button><button className="button primary">{editingCustomer ? 'Update customer' : 'Save customer'}</button></div></form></div>}
      <div className="panel table-panel"><table><thead><tr><th>Customer</th><th>Type</th><th>Status</th><th>Follow-up</th><th>Contact</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><div className="table-person"><div className="avatar pale">{customer.name[0]}</div><div><b>{customer.name}</b><span>{customer.business_name || 'Independent customer'}</span></div></div></td><td><span className="tag">{label(customer.customer_type)}</span></td><td><span className={`status ${customer.status}`}>{label(customer.status)}</span></td><td>{customer.follow_up_date ? new Date(customer.follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td><td>{customer.mobile}</td><td><div className="table-actions"><button className="text-button" onClick={() => setSelected(customer)}>View</button>{canEdit && <button className="text-button" onClick={() => { setShowForm(false); setEditingCustomer(customer); }}>Edit</button>}</div></td></tr>)}</tbody></table>{!customers.length && <Empty text="No customers yet" />}</div>
      {selected && <CustomerDetail customer={selected} canEdit={canEdit} onEdit={() => { setSelected(null); setEditingCustomer(selected); }} close={() => setSelected(null)} />}
    </>
  );
}
