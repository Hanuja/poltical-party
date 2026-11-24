import axios from 'axios';

const TOKEN_KEY = 'rise_token';
const USER_KEY = 'rise_user';
const REMEMBER_KEY = 'rise_remember';

export function getToken() {
  if (localStorage.getItem(REMEMBER_KEY) === '1') return localStorage.getItem(TOKEN_KEY);
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user, remember) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY); other.removeItem(USER_KEY);
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      clearSession();
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
