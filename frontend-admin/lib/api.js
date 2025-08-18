const API_URL = "http://localhost:5500";

export async function fetchOrders(status) {
  const res = await fetch(`${API_URL}/api/orders/${status}/get-all-by-status`, {
    credentials: "include" // envia o cookie junto
  });
  return res.json();
}

export async function fetchOrderById(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
    credentials: "include" // envia o cookie junto
  });
  return res.json();
}

export async function fetchCreateOrder(orderData) {
  const res = await fetch(`${API_URL}/api/orders/create`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderData)
  });
  return res.json();
}

export async function fetchUpdateOrder(orderId, updatedData) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/update`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatedData)
  });
  return res.json();
}

export async function fetchPayOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/pay`, {
    method: "PATCH",
    credentials: "include"
  });
  return res.json();
}

export async function fetchCancelOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
    method: "PATCH",
    credentials: "include"
  });
  return res.json();
}

export async function fetchDeleteOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/delete`, {
    method: "DELETE",
    credentials: "include"
  });
  return res.json();
}
