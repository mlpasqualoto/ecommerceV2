const API_URL = "http://localhost:5500";

export async function fetchOrders(status) {
  const res = await fetch(`${API_URL}/api/orders/${status}/get-all-by-status`, {
    credentials: "include" // envia o cookie junto
  });
  return res.json();
}