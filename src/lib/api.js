export const TOKEN_KEY = 'erpcrm_token';

export const api = async (url, options = {}) => {
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

export const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
export const label = (value) => String(value || '').replaceAll('_', ' ');
