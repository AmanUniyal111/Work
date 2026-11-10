const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const tokenStore = {
  get: () => localStorage.getItem("campus_token"),
  set: (token) => localStorage.setItem("campus_token", token),
  clear: () => localStorage.removeItem("campus_token")
};

export async function api(path, options = {}) {
  const token = tokenStore.get();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
