const API_URL = "http://localhost:5500";

// Tratador comum de resposta: tenta parsear JSON, trata 429 exibindo toast
async function handleResponse(res) {
  if (res.status === 429) {
    try {
      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      const serverMessage = parsed?.message || parsed?.error || text || '';
      const message = serverMessage
        ? `Limite de requisições atingido: ${serverMessage}`
        : 'Você excedeu o limite de requisições. Tente novamente mais tarde.';

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message } }));
      }
    } catch (e) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.' } }));
      }
    }

    return { status: 429, error: 'Too Many Requests', message: 'Limite de requisições atingido' };
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: res.ok, raw: text };
  }
}

export async function fetchOrders(status) {
  const res = await fetch(`${API_URL}/api/orders/${status}/get-all-by-status`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchProducts(status) {
  const res = await fetch(`${API_URL}/api/products/admin?status=${status}`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchUsers() {
  const res = await fetch(`${API_URL}/api/users/`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchOrderById(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchOrderByDate(date) {
  const res = await fetch(`${API_URL}/api/orders/${date}/get-all-by-date`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchProductById(productId) {
  const res = await fetch(`${API_URL}/api/products/${productId}`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchUserById(userId) {
  const res = await fetch(`${API_URL}/api/users/${userId}`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchUsersByRole(role) {
  const res = await fetch(`${API_URL}/api/users/role/${role}`, {
    credentials: "include", // envia o cookie junto
  });
  return handleResponse(res);
}

export async function fetchCreateOrder(orderData) {
  const res = await fetch(`${API_URL}/api/orders/create`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });
  return handleResponse(res);
}

export async function fetchCreateProduct(formData) {
  const res = await fetch(`${API_URL}/api/products/create`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return handleResponse(res);
};

export async function fetchCreateUser(userData) {
  const res = await fetch(`${API_URL}/api/users/admin/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function fetchUpdateOrder(orderId, updatedData) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/update`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedData),
  });
  return handleResponse(res);
}

export async function fetchUpdateProduct(productId, formData) {
  const res = await fetch(`${API_URL}/api/products/${productId}/update`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  return handleResponse(res);
};

export async function fetchStatusProduct(productId, status) {
  const res = await fetch(`${API_URL}/api/products/${productId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(status),
  });
  return handleResponse(res);
}

export async function fetchPayOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/pay`, {
    method: "PATCH",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function fetchShipOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/ship`, {
    method: "PATCH",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function fetchCancelOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
    method: "PATCH",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function fetchDeleteOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/delete`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function fetchDeleteProduct(productId) {
  const res = await fetch(`${API_URL}/api/products/${productId}/delete`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}
