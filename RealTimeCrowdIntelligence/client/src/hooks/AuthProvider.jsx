import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api, setAuthToken } from '../lib/api';
import { AuthContext } from './authContext';

function readStoredUser() {
  const raw = localStorage.getItem('crowd_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('crowd_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('crowd_token'));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('crowd_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('crowd_token');
        localStorage.removeItem('crowd_user');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('crowd_token', data.token);
    localStorage.setItem('crowd_user', JSON.stringify(data.user));
    setAuthToken(data.token);
    toast.success(`Welcome back, ${data.user.name}`);
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('crowd_token', data.token);
    localStorage.setItem('crowd_user', JSON.stringify(data.user));
    setAuthToken(data.token);
    toast.success('Account created');
  }

  function logout() {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('crowd_token');
    localStorage.removeItem('crowd_user');
  }

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, isAdmin: user?.role === 'admin' }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
