// Simple API client for backend integration
const BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:3000/api';

function decodeJwt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload || {};
  } catch {
    return {};
  }
}

export function getAuth() {
  const raw = localStorage.getItem('auth');
  if (!raw) return null;
  try {
    const auth = JSON.parse(raw);
    return auth && auth.token ? auth : null;
  } catch {
    return null;
  }
}

export function setAuth(token) {
  const payload = decodeJwt(token);
  localStorage.setItem('auth', JSON.stringify({ token, role: payload.role || null, userId: payload.id || null }));
}

export function clearAuth() {
  localStorage.removeItem('auth');
}

function authHeader() {
  const auth = getAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await handle(res);
  if (data?.token) setAuth(data.token);
  return data;
}

export async function register({ name, email, password, role }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  });
  return handle(res);
}

export async function getRides() {
  const res = await fetch(`${BASE_URL}/rides`);
  return handle(res);
}

export async function createRide({ from, to, date, price, availableSeats }) {
  const res = await fetch(`${BASE_URL}/rides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ from, to, date, price, availableSeats })
  });
  return handle(res);
}

export async function bookRide(rideId) {
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ rideId })
  });
  return handle(res);
}

export async function getDriverBookings() {
  const res = await fetch(`${BASE_URL}/bookings/driver`, {
    headers: { ...authHeader() }
  });
  return handle(res);
}

export async function getRiderBookings() {
  const res = await fetch(`${BASE_URL}/bookings/rider`, {
    headers: { ...authHeader() }
  });
  return handle(res);
}

export async function updateBookingStatus(bookingId, status) {
  const res = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ status })
  });
  return handle(res);
}

export async function cancelBooking(bookingId) {
  const res = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: { ...authHeader() }
  });
  return handle(res);
}

export async function deleteRide(rideId) {
  const res = await fetch(`${BASE_URL}/rides/${rideId}`, {
    method: 'DELETE',
    headers: { ...authHeader() }
  });
  return handle(res);
}
