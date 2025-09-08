"use client";
import { useEffect, useState, Fragment } from "react";
import {
  fetchOrders,
  fetchOrderById,
  fetchOrderByDate,
  fetchCreateOrder,
  fetchUpdateOrder,
  fetchPayOrder,
  fetchShipOrder,
  fetchCancelOrder,
  fetchDeleteOrder,
} from "../lib/api.js";
import { formatCurrencyBRL } from "../utils/utils.js";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    productId: "",
    quantity: "",
    status: "",
    totalAmount: "",
  });
  const [newOrder, setNewOrder] = useState({
    items: [{ productId: "", quantity: "" }],
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("paid");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, orderId: null });
  const router = useRouter();

  // Função para recarregar/atualizar os dados
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders(statusFilter);

      if (
        data?.message?.toLowerCase().includes("não autenticado") ||
        data?.error === "Unauthorized"
      ) {
        router.push("/login");
        return;
      }

      setOrders(data.orders || []);

      // Feedback visual de sucesso
      const refreshButton = document.querySelector('[data-refresh-btn]');
      refreshButton?.classList.add('animate-spin');
      setTimeout(() => {
        refreshButton?.classList.remove('animate-spin');
      }, 1000);

    } catch (err) {
      console.error("Erro ao atualizar pedidos:", err);
    } finally {
      setLoading(false);
      toggleOrderDetails();
    }
  };

  // Função para exportar dados
  const handleExportData = () => {
    try {
      // Preparar dados para exportação
      const exportData = orders.map(order => ({
        ID: order._id,
        Data: new Date(order.createdAt).toLocaleDateString("pt-BR"),
        Cliente: order.name,
        Status: getStatusText(order.status),
        Total: `R$ ${order.totalAmount.toFixed(2).replace('.', ',')}`,
        Produtos: order.items.map(item => `${item.name} (${item.quantity}x)`).join(', '),
        'Total de Itens': order.totalQuantity
      }));

      // Converter para CSV
      const csvContent = [
        // Cabeçalhos
        Object.keys(exportData[0] || {}).join(';'),
        // Dados
        ...exportData.map(row => Object.values(row).join(';'))
      ].join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Feedback visual
      const exportButton = document.querySelector('[data-export-btn]');
      exportButton?.classList.add('bg-green-200', 'text-green-700');
      setTimeout(() => {
        exportButton?.classList.remove('bg-green-200', 'text-green-700');
      }, 2000);

    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };

  // Animação de entrada da página
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Toggle detalhes do pedido
  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Abre modal e preenche dados do pedido
  const openEditModal = (order) => {
    setEditOrder(order);
    setEditForm({
      productId: order.items[0].productId,
      quantity: order.items[0].quantity,
      status: order.status,
      totalAmount: order.totalAmount,
    });
  };

  // Fecha modal
  const closeEditModal = () => {
    setEditOrder(null);
    setEditForm({ productId: "", quantity: "", status: "", totalAmount: "" });
  };

  // Atualiza campos do formulário
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Envia atualização
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editOrder) return;
    await handleUpdateOrder(editOrder._id, {
      productId: editForm.productId,
      quantity: Number(editForm.quantity),
      status: editForm.status,
      totalAmount: Number(editForm.totalAmount),
    });
    closeEditModal();
  };

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await fetchOrders(statusFilter);

        if (
          data?.message?.toLowerCase().includes("não autenticado") ||
          data?.error === "Unauthorized"
        ) {
          router.push("/login");
          return;
        }

        setOrders(data.orders || []);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      } finally {
        setLoading(false);
        toggleOrderDetails();
      }
    };

    loadOrders();
  }, [statusFilter, router]);

  const handleFilterById = async (e) => {
    e.preventDefault();
    const orderId = e.target.elements.orderId.value;
    if (orderId) {
      const data = await fetchOrderById(orderId);
      if (
        data?.message?.toLowerCase().includes("não autenticado") ||
        data?.error === "Unauthorized"
      ) {
        router.push("/login");
        return;
      }

      if (!data.order) {
        setOrders([]);
      } else {
        setOrders([data.order]);
        toggleOrderDetails();
      }
    }
  };

  const handleFilterByDate = async (orderDate) => {
    if (orderDate) {
      const data = await fetchOrderByDate(orderDate);
      if (
        data?.message?.toLowerCase().includes("não autenticado") ||
        data?.error === "Unauthorized"
      ) {
        router.push("/login");
        return;
      }

      if (!data.orders || data.orders.length === 0) {
        setOrders([]);
      } else {
        setOrders(data.orders);
        toggleOrderDetails();
      }
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    const newOrderData = {
      items: newOrder.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
    };

    const data = await fetchCreateOrder(newOrderData);

    if (!data.order) {
      console.error("Pedido não foi criado corretamente:", data);
      return;
    }

    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }

    setOrders((prevOrders) => [...prevOrders, data.order]);
    setNewOrder({ items: [{ productId: "", quantity: "" }] });
    setIsCreateModalOpen(false);
  };

  const handleNewOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder((prev) => ({ ...prev, [name]: value }));
  };

  // Atualiza campos do item do pedido
  const handleNewOrderItemChange = (index, e) => {
    const { name, value } = e.target;
    setNewOrder((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index][name] = value;
      return { ...prev, items: updatedItems };
    });
  };

  // Adiciona um novo produto ao pedido
  const handleAddItem = () => {
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: "" }],
    }));
  };

  // Remove um produto do pedido
  const handleRemoveItem = (index) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateOrder = async (orderId, updatedData) => {
    const data = await fetchUpdateOrder(orderId, updatedData);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...updatedData } : order
      )
    );
  };

  const handlePayOrder = async (orderId) => {
    const data = await fetchPayOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...data.order } : order
      )
    );
  };

  const handleShipOrder = async (orderId) => {
    const data = await fetchShipOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...data.order } : order
      )
    );
  };

  const handleCancelOrder = async (orderId) => {
    const data = await fetchCancelOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...data.order } : order
      )
    );
  };

  const handleDeleteOrder = async (orderId) => {
    const data = await fetchDeleteOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order._id !== orderId)
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border border-amber-200",
      shipped: "bg-blue-50 text-blue-700 border border-blue-200",
      delivered: "bg-green-50 text-green-700 border border-green-200",
      cancelled: "bg-red-50 text-red-700 border border-red-200",
    };
    return (
      colors[status] || "bg-slate-50 text-slate-700 border border-slate-200"
    );
  };

  const getStatusText = (status) => {
    const texts = {
      paid: "Pago",
      pending: "Pendente",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-screen h-dvh bg-white/95 backdrop-blur-sm flex items-center justify-center z-[9999] text-[#1a73e8] text-xl">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="relative">
            <i className="fa-solid fa-spinner animate-spin text-4xl"></i>
            <div className="absolute inset-0 rounded-full animate-ping"></div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Carregando pedidos...</div>
            <div className="text-sm text-slate-500 mt-1">
              Aguarde um momento
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-opacity duration-700 ${isPageLoaded ? "opacity-100" : "opacity-0"
        }`}
    >
      {/* Header Principal */}
      <div className={`bg-white border-b border-slate-200 shadow-sm transform transition-transform duration-500 ${isPageLoaded ? "translate-y-0" : "-translate-y-4"
        }`}>
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fadeInLeft">
              {/* Título com ícone */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Gerenciamento de Pedidos
                </h1>
              </div>

              <p className="text-slate-600 max-w-2xl leading-relaxed">
                Controle completo sobre todos os pedidos do seu e-commerce.
                Visualize, edite e gerencie o status de cada transação.
              </p>

              {/* Indicadores visuais */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Sistema Online</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Atualizado em tempo real</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 animate-fadeInRight">
              {/* Card de estatísticas melhorado */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  {/* Ícone de pedidos */}
                  <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl">
                    <svg
                      className="w-7 h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  {/* Números e descrição */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 transition-all duration-300 hover:text-blue-600 leading-none">
                      {orders.length}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {orders.length === 1 ? 'pedido listado' : 'pedidos listados'}
                    </div>
                    <div className="flex items-center justify-end space-x-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Ativo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de ações rápidas (opcional) */}
              <div className="flex flex-col gap-4 items-center">
                {/* Botão de atualizar dados */}
                <button
                  onClick={handleRefreshData}
                  data-refresh-btn
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 group cursor-pointer"
                  title="Atualizar dados"
                  disabled={loading}
                >
                  <svg
                    className={`w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-all duration-200 ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                {/* Botão de exportar dados */}
                <button
                  onClick={handleExportData}
                  data-export-btn
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 group cursor-pointer"
                  title="Exportar dados (CSV)"
                  disabled={orders.length === 0}
                >
                  <svg
                    className="w-5 h-5 text-slate-600 group-hover:text-slate-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-8 py-8">
        {/* Modal de Edição */}
        {editOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 transform animate-scaleIn">

              {/* Cabeçalho fixo */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Editar Pedido</h2>
                  <p className="text-sm text-slate-600 mt-1">ID: {editForm.productId}</p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="cursor-pointer bg-red-50 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.1s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Produto ID
                  </label>
                  <input
                    name="productId"
                    type="text"
                    value={editForm.productId}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-sm transition-colors duration-200"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Quantidade
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    value={editForm.quantity}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-slate-900 hover:border-slate-300"
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.4s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Total (R$)
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={editForm.totalAmount}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div
                  className="flex justify-end space-x-3 pt-6 animate-slideInUp"
                  style={{ animationDelay: "0.5s" }}
                >
                  <button
                    type="button"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                    onClick={closeEditModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 hover:shadow-xl"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Criação */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 transform animate-scaleIn">

              {/* Cabeçalho fixo */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Criar Novo Pedido</h2>
                  <p className="text-sm text-slate-600 mt-1">Adicione um novo pedido ao sistema</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="cursor-pointer bg-red-50 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                {newOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-end">
                    <div
                      className="flex-1 space-y-2 animate-slideInUp"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <label className="block text-sm font-semibold text-slate-700">
                        Produto ID
                      </label>
                      <input
                        type="text"
                        name="productId"
                        value={item.productId}
                        onChange={(e) => handleNewOrderItemChange(idx, e)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 text-slate-900"
                        placeholder="Digite o ID do produto"
                        required
                      />
                    </div>

                    <div
                      className="w-32 space-y-2 animate-slideInUp"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <label className="block text-sm font-semibold text-slate-700">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleNewOrderItemChange(idx, e)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                        min="1"
                        required
                      />
                    </div>

                    {newOrder.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="cursor-pointer px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 animate-slideInUp"
                        style={{ animationDelay: "0.1s" }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="cursor-pointer mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  + Adicionar Produto
                </button>

                <div
                  className="flex justify-end space-x-3 pt-6 animate-slideInUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <button
                    type="button"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 hover:shadow-xl"
                  >
                    Criar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-fadeIn">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja excluir este pedido? Essa ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm({ open: false, orderId: null })}
                  className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDeleteOrder(deleteConfirm.orderId);
                    setDeleteConfirm({ open: false, orderId: null });
                  }}
                  className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Controles */}
        <div
          className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 transform transition-all duration-500 hover:shadow-md ${isPageLoaded
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
            }`}
          style={{ transitionDelay: "0.1s" }}
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Busca por ID */}
              <form
                onSubmit={handleFilterById}
                className="flex items-center gap-3 animate-slideInUp"
                style={{ animationDelay: "0.2s" }}
              >
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Buscar por ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="orderId"
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-mono min-w-[200px] placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    placeholder="ID do pedido..."
                  />
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    Buscar
                  </button>
                </div>
              </form>

              {/* Filtro por Status */}
              <div
                className="flex items-center gap-3 animate-slideInUp"
                style={{ animationDelay: "0.3s" }}
              >
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Filtrar por Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium min-w-[140px] text-slate-900 hover:border-slate-300"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Filtro por Data */}
              <div
                className="flex items-center gap-3 animate-slideInUp"
                style={{ animationDelay: "0.4s" }}
              >
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Filtrar por Data:
                </label>
                <input
                  type="date"
                  name="orderDate"
                  onChange={(e) => handleFilterByDate(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-mono min-w-[140px] placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Botão Novo Pedido */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg flex items-center gap-2 whitespace-nowrap transform hover:scale-105 hover:shadow-xl animate-slideInUp"
              style={{ animationDelay: "0.5s" }}
            >
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Novo Pedido
            </button>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div
          className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transform transition-all duration-500 hover:shadow-md ${isPageLoaded
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
            }`}
          style={{ transitionDelay: "0.2s" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Data & Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Qtd
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length > 0 ? (
                  orders.map((order, idx) =>
                    order ? (
                      <Fragment key={order._id || idx}>
                        {/* Linha Principal */}
                        <tr
                          key={order._id || idx}
                          className="hover:bg-slate-50 transition-all duration-200 group animate-fadeInUp"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-slate-900 transition-colors duration-200 group-hover:text-blue-600">
                              {new Date(order.createdAt).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                }
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(order.createdAt).toLocaleString(
                                "pt-BR",
                                {
                                  timeZone: "America/Sao_Paulo",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="mb-1">
                                <div className="text-sm font-semibold text-slate-900 max-w-[200px] truncate">
                                  {item.name}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                  {item.productId} • Qtd: {item.quantity}
                                </div>
                              </div>
                            ))}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 text-sm font-bold rounded-full transition-all duration-200 group-hover:bg-blue-100 group-hover:text-blue-700">
                              {order.totalQuantity}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-slate-900 max-w-[150px] truncate">
                              {order.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {order.userId}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusText(order.status)}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="text-sm font-bold text-slate-900 transition-colors duration-200 group-hover:text-emerald-600">
                              {formatCurrencyBRL(order.totalAmount)}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="cursor-pointer p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                onClick={() => openEditModal(order)}
                                title="Editar pedido"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>

                              <button
                                className="cursor-pointer p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                onClick={() => setDeleteConfirm({ open: true, orderId: order._id })}
                                title="Deletar pedido"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <button
                              className="cursor-pointer p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                              onClick={() => toggleOrderDetails(order._id)}
                              title={
                                expandedOrder === order._id
                                  ? "Ocultar detalhes"
                                  : "Ver detalhes"
                              }
                            >
                              <svg
                                className={`w-4 h-4 transition-transform duration-300 ${expandedOrder === order._id
                                  ? "rotate-180"
                                  : ""
                                  }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Linha de Detalhes Expandida */}
                        {expandedOrder === order._id && (
                          <tr
                            key={`${order._id}-details`}
                            className="bg-slate-50 animate-slideDown"
                          >
                            <td colSpan="10" className="px-6 py-6">
                              <div className="bg-white rounded-xl p-6 border border-slate-200 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {/* Informações do Pedido */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.1s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Informações do Pedido
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          ID do Pedido
                                        </label>
                                        <p className="text-sm font-mono text-slate-900">
                                          #{order._id}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Produtos
                                        </label>
                                        <ul className="text-sm text-slate-900 space-y-1">
                                          {order.items.map((item, idx) => (
                                            <li key={idx}>
                                              {item.name} — {item.quantity}x (
                                              {formatCurrencyBRL(item.price)})
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Total, Pagamento e Endereço */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.2s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Total, Pagamento e Endereço
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Total a pagar
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {formatCurrencyBRL(order.totalAmount)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Forma de pagamento
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {/* forma de pagamento */}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Endereço de entrega
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {/* endereço de entrega */}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status e Data */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.3s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Status e Datas
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Status Atual
                                        </label>
                                        <div className="mt-1">
                                          <span
                                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${getStatusColor(
                                              order.status
                                            )}`}
                                          >
                                            {getStatusText(order.status)}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Criado em
                                        </label>
                                        <p className="text-sm text-slate-900">
                                          {new Date(
                                            order.createdAt
                                          ).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Pago em
                                        </label>
                                        <p className="text-sm text-slate-900">
                                          {new Date({
                                            /* data de pagamento */
                                          }).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Ações Rápidas */}
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-4">
                                    Ações Rápidas de Status
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="cursor-pointer px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() => handlePayOrder(order._id)}
                                      title="Marcar como pago"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-credit-card"
                                        viewBox="0 0 16 16"
                                      >
                                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
                                        <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                      </svg>
                                      Pagar
                                    </button>

                                    <button
                                      className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() => handleShipOrder(order._id)}
                                      title="Enviar pedido"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-truck"
                                        viewBox="0 0 16 16"
                                      >
                                        <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
                                      </svg>
                                      Enviar
                                    </button>

                                    <button
                                      className="cursor-pointer px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() =>
                                        handleCancelOrder(order._id)
                                      }
                                      title="Cancelar pedido"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ) : null
                  )
                ) : (
                  <tr key="no-orders">
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4 animate-fadeIn">
                        <div className="relative">
                          <svg
                            className="w-16 h-16 text-slate-300 animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1"
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                          <div className="absolute inset-0 bg-slate-300/30 rounded-full animate-ping"></div>
                        </div>
                        <div
                          className="text-slate-500 animate-slideInUp"
                          style={{ animationDelay: "0.2s" }}
                        >
                          <div className="text-lg font-semibold mb-2">
                            Nenhum pedido encontrado
                          </div>
                          <div className="text-sm max-w-sm mx-auto leading-relaxed">
                            Não há pedidos com os filtros selecionados. Tente
                            ajustar os critérios de busca ou criar um novo
                            pedido.
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer com informações extras */}
        <div
          className={`mt-8 text-center text-sm text-slate-500 animate-fadeIn ${isPageLoaded ? "opacity-100" : "opacity-0"
            }`}
          style={{ transitionDelay: "0.3s" }}
        >
          <p>
            Painel de Administração • Total de {orders.length} pedidos listados
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        .animate-fadeInLeft {
          animation: fadeInLeft 0.6s ease-out forwards;
        }

        .animate-fadeInRight {
          animation: fadeInRight 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
