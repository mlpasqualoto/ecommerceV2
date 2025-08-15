import { getToken } from "./auth";

const API_URL = "http://localhost:4000"; // ajuste para sua API

export async function loginAdmin(username, password) {
  const res = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function fetchOrders() {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}
