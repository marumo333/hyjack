// lib/apiClient.ts
const API_BASE = "http://localhost:8000/api"; // Laravel Sailのポート

export async function loginWithEmail(email: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  return await res.json();
}

export async function getUser(token: string) {
  const res = await fetch(`${API_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return await res.json();
}