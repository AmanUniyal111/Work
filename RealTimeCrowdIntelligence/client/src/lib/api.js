import axios from 'axios';

const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const API_URL = import.meta.env.VITE_API_URL || `http://${apiHost}:5001/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${apiHost}:5001`;

export const api = axios.create({
  baseURL: API_URL
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
