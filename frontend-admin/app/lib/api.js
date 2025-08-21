const API_URL = "http://localhost:5500";

export async function fetchOrders(status) {
  const res = await fetch(`${API_URL}/api/orders/${status}/get-all-by-status`, {
    credentials: "include" // envia o cookie junto
  });
  return res.json();
}

export async function fetchProducts(status) {
  const res = await fetch(`${API_URL}/api/products?status=${status}`, {
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

export async function fetchOrderByDate(date) {
  const res = await fetch(`${API_URL}/api/orders/${date}/get-all-by-date`, {
    credentials: "include" // envia o cookie junto
  });
  return res.json();
}

export async function fetchProductById(productId) {
  const res = await fetch(`${API_URL}/api/products/${productId}`, {
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

export async function fetchCreateProduct(productData) {
  const res = await fetch(`${API_URL}/api/products/create`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productData)
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

export async function fetchUpdateProduct(productId, updatedData) {
  const res = await fetch(`${API_URL}/api/products/${productId}/update`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatedData)
  });
  return res.json();
}

export async function fetchStatusProduct(productId, status) {
  const res = await fetch(`${API_URL}/api/products/${productId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(status)
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

export async function fetchShipOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/ship`, {
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

export async function fetchDeleteProduct(productId) {
  const res = await fetch(`${API_URL}/api/products/${productId}/delete`, {
    method: "DELETE",
    credentials: "include"
  });
  return res.json();
}
