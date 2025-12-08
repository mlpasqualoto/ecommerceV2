const API_URL = "https://ecommercev2-rg6c.onrender.com";

// Tratador comum de resposta: tenta parsear JSON e sempre usa toast para erros (incluindo 429)
async function handleResponse(res) {
  const status = res.status;
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  const serverMessage = parsed?.message || parsed?.error || text || '';

  if (!res.ok) {
    const message = status === 429
      ? (serverMessage ? `Limite de requisições atingido: ${serverMessage}` : 'Você excedeu o limite de requisições. Tente novamente mais tarde.')
      : `${serverMessage || 'Erro desconhecido'} Status: ${status}.`;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message } }));
    }

    if (status === 429) {
      return { status: 429, error: 'Too Many Requests', message: serverMessage || 'Limite de requisições atingido' };
    }

    return parsed ?? { ok: res.ok, status, raw: text };
  }

  return parsed ?? { ok: res.ok, raw: text };
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

// **** SINCRONIZAÇÃO OLIST **** //
// Sincronizar pedidos da Olist (admin)
export async function fetchOlistSync(dataInicial, dataFinal) {
  // Codifica as datas para substituir "/" por "%2F"
  const encodedInicial = encodeURIComponent(dataInicial);
  const encodedFinal = encodeURIComponent(dataFinal);

  const res = await fetch(`${API_URL}/api/orders/olistSync/${encodedInicial}/${encodedFinal}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(res);
}

// **** ANALÍTICOS DO DASHBOARD **** //
// Buscar estatísticas do dashboard no backend
export async function fetchDashboardStats(startDate, endDate) {
  const res = await fetch(`${API_URL}/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(res);
}

// **** RELATÓRIOS **** //
// Busca relatório semanal e mensal, comparação de períodos e exportação em CSV
/**
 * Busca relatório semanal
 * @param {string} weekYear - Formato: "2024-W50"
 * @returns {Promise<Object>}
 */
export async function fetchWeeklyReport(weekYear) {
  const res = await fetch(`${API_URL}/reports/weekly/${weekYear}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  return handleResponse(res);
}

/**
 * Busca relatório mensal
 * @param {string} monthYear - Formato: "2024-12"
 * @returns {Promise<Object>}
 */
export async function fetchMonthlyReport(monthYear) {
  const res = await fetch(`${API_URL}/reports/monthly/${monthYear}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  return handleResponse(res);
}

/**
 * Compara dois períodos
 * @param {string} period1Start - Data inicial período 1
 * @param {string} period1End - Data final período 1
 * @param {string} period2Start - Data inicial período 2
 * @param {string} period2End - Data final período 2
 * @returns {Promise<Object>}
 */
export async function compareReportPeriods(period1Start, period1End, period2Start, period2End) {
  const params = new URLSearchParams({
    period1Start,
    period1End,
    period2Start,
    period2End,
  });

  const res = await fetch(`${API_URL}/reports/compare?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  return handleResponse(res);
}

/**
 * Exporta relatório em CSV
 * @param {string} reportType - "weekly" ou "monthly"
 * @param {string} period - Período do relatório
 * @returns {Promise<Blob|Object>}
 */
export async function exportReportCSV(reportType, period) {
  const endpoint = reportType === 'weekly'
    ? `${API_URL}/reports/weekly/${period}/export`
    : `${API_URL}/reports/monthly/${period}/export`;

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials: 'include',
  });

  // Se a requisição falhar (ex: 400, 401, 500), usamos o handleResponse para processar a mensagem de erro JSON e exibir o toast.
  if (!res.ok) {
    return handleResponse(res);
  }

  const blob = await res.blob();
  return blob;
}

/**
 * Baixa arquivo CSV
 * @param {Blob} blob - Arquivo blob
 * @param {string} filename - Nome do arquivo
 */
export function downloadCSV(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
