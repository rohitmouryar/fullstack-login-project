const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { message: 'The server returned an invalid response.' };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export function loginUser(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(token) {
  return request('/auth/me', { headers: authHeaders(token) });
}

export function getAdminUsers(token) {
  return request('/admin/users', { headers: authHeaders(token) });
}

export function createAdminUser(token, payload) {
  return request('/admin/users', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function changeUserStatus(token, userId, status) {
  return request(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export function removeUser(token, userId) {
  return request(`/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
