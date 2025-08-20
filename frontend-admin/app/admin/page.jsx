"use client";
import { useEffect, useState } from "react";
import { fetchOrders, fetchOrderById, fetchCreateOrder, fetchUpdateOrder, fetchPayOrder, fetchShipOrder, fetchCancelOrder, fetchDeleteOrder } from "../lib/api.js";
import { formatCurrencyBRL } from "../utils/utils.js";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({ productId: '', quantity: '', status: '', totalAmount: '' });
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: "" });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("paid");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const router = useRouter();

  // Toggle detalhes do pedido
  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Abre modal e preenche dados do pedido
  const openEditModal = (order) => {
    setEditOrder(order);
    setEditForm({ productId: order.items[0].productId, quantity: order.items[0].quantity, status: order.status, totalAmount: order.totalAmount });
  };

  // Fecha modal
  const closeEditModal = () => {
    setEditOrder(null);
    setEditForm({ productId: '', quantity: '', status: '', totalAmount: '' });
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
      }
    };

    loadOrders();
  }, [statusFilter, router]);

  const handleFilterById = async (e) => {
    e.preventDefault();
    const orderId = e.target.elements.orderId.value;
    if (orderId) {
      const data = await fetchOrderById(orderId);
      if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
        router.push("/login");
        return;
      }
      setOrders([data.order]);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    const newOrderData = {
      items: [
        {
          productId: newOrder.productId,
          quantity: Number(newOrder.quantity)
        }
      ]
    };

    const data = await fetchCreateOrder(newOrderData);
    console.log(data);

    if (!data.order) {
      console.error("Pedido não foi criado corretamente:", data);
      return;
    }

    if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
      router.push("/login");
      return;
    }

    setOrders((prevOrders) => [...prevOrders, data.order]);
    setNewOrder({ productId: "", quantity: "" });
    setIsCreateModalOpen(false);
  };

  const handleNewOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateOrder = async (orderId, updatedData) => {
    const data = await fetchUpdateOrder(orderId, updatedData);
    if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order._id === orderId ? { ...order, ...updatedData } : order))
    );
  };

  const handlePayOrder = async (orderId) => {
    const data = await fetchPayOrder(orderId);
    if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order._id === orderId ? { ...order, ...data.order } : order))
    );
  };

  const handleShipOrder = async (orderId) => {
    const data = await fetchShipOrder(orderId);
    if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order._id === orderId ? { ...order, ...data.order } : order))
    );
  };

  const handleCancelOrder = async (orderId) => {
    const data = await fetchCancelOrder(orderId);
    if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order._id === orderId ? { ...order, ...data.order } : order))
    );
  };

  const handleDeleteOrder = async (orderId) => {
    const data = await fetchDeleteOrder(orderId);
    if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border border-amber-200",
      shipped: "bg-blue-50 text-blue-700 border border-blue-200",
      delivered: "bg-green-50 text-green-700 border border-green-200",
      cancelled: "bg-red-50 text-red-700 border border-red-200"
    };
    return colors[status] || "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const getStatusText = (status) => {
    const texts = {
      paid: "Pago",
      pending: "Pendente",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado"
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-slate-600 font-medium">Carregando pedidos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gerenciamento de Pedidos</h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                Controle completo sobre todos os pedidos do seu e-commerce. Visualize, edite e gerencie o status de cada transação.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
                <div className="text-sm text-slate-500">pedidos listados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-8">

        {/* Modal de Edição */}
        {editOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Editar Pedido</h2>
                <p className="text-sm text-slate-600 mt-1">ID: {editOrder._id}</p>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Produto ID</label>
                  <input
                    name="productId"
                    type="text"
                    value={editForm.productId}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Quantidade</label>
                  <input
                    name="quantity"
                    type="number"
                    value={editForm.quantity}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900"
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Total (R$)</label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={editForm.totalAmount}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    onClick={closeEditModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Criar Novo Pedido</h2>
                <p className="text-sm text-slate-600 mt-1">Adicione um novo pedido ao sistema</p>
              </div>

              <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Produto ID</label>
                  <input
                    type="text"
                    name="productId"
                    value={newOrder.productId}
                    onChange={handleNewOrderChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                    placeholder="Digite o ID do produto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Quantidade</label>
                  <input
                    type="number"
                    name="quantity"
                    value={newOrder.quantity}
                    onChange={handleNewOrderChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                    min="1"
                    placeholder="Quantidade de itens"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg"
                  >
                    Criar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Barra de Controles */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">

              {/* Filtro por Status */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Filtrar por Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium min-w-[140px] text-slate-900"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Busca por ID */}
              <form onSubmit={handleFilterById} className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Buscar por ID:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="orderId"
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-mono min-w-[200px] placeholder:text-slate-300 text-slate-900"
                    placeholder="ID do pedido..."
                  />
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </div>

            {/* Botão Novo Pedido */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Pedido
            </button>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Data & Hora</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Produtos</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Qtd</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Ações</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length > 0 ? orders.map((order, idx) => (
                  order ? (
                    <>
                      {/* Linha Principal */}
                      <tr key={order._id || idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold text-slate-900">
                            {new Date(order.createdAt).toLocaleString("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleString("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 text-sm font-bold rounded-full">
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
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="text-sm font-bold text-slate-900">
                            {formatCurrencyBRL(order.totalAmount)}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="cursor-pointer p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                              onClick={() => openEditModal(order)}
                              title="Editar pedido"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              className="cursor-pointer p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                              onClick={() => handleDeleteOrder(order._id)}
                              title="Deletar pedido"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <button
                            className="cursor-pointer p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all"
                            onClick={() => toggleOrderDetails(order._id)}
                            title={expandedOrder === order._id ? "Ocultar detalhes" : "Ver detalhes"}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${expandedOrder === order._id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* Linha de Detalhes Expandida */}
                      {expandedOrder === order._id && (
                        <tr className="bg-slate-50">
                          <td colSpan="10" className="px-6 py-6">
                            <div className="bg-white rounded-xl p-6 border border-slate-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Informações do Pedido */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                    Informações do Pedido
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">ID do Pedido</label>
                                      <p className="text-sm font-mono text-slate-900">#{order._id}</p>
                                    </div>
                                    {/* parou aqui */}
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Produtos</label>
                                      <ul className="text-sm text-slate-900 space-y-1">
                                        {order.items.map((item, idx) => (
                                          <li key={idx}>
                                            {item.name} — {item.quantity}x ({formatCurrencyBRL(item.price)})
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                                {/* Total, Pagamento e Endereço */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                    Total, Pagamento e Endereço
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total a pagar</label>
                                      <p className="text-sm text-slate-900 font-semibold">{formatCurrencyBRL(order.totalAmount)}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Forma de pagamento</label>
                                      <p className="text-sm text-slate-900 font-semibold">{/* forma de pagamento */}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Endereço de entrega</label>
                                      <p className="text-sm text-slate-900 font-semibold">{/* endereço de entrega */}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Status e Data */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                    Status e Datas
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status Atual</label>
                                      <div className="mt-1">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                          {getStatusText(order.status)}
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Criado em</label>
                                      <p className="text-sm text-slate-900">
                                        {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pago em</label>
                                      <p className="text-sm text-slate-900">
                                        {new Date({/* data de pagamento */ }).toLocaleDateString("pt-BR", {
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
                                    className="cursor-pointer px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
                                    onClick={() => handlePayOrder(order._id)}
                                    title="Marcar como pago"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-credit-card" viewBox="0 0 16 16">
                                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
                                      <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                    </svg>
                                    Pagar
                                  </button>

                                  <button
                                    className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
                                    onClick={() => handleShipOrder(order._id)}
                                    title="Enviar pedido"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-truck" viewBox="0 0 16 16">
                                      <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
                                    </svg>
                                    Enviar
                                  </button>

                                  <button
                                    className="cursor-pointer px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
                                    onClick={() => handleCancelOrder(order._id)}
                                    title="Cancelar pedido"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ) : null
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <div className="text-slate-500">
                          <div className="text-lg font-semibold mb-2">Nenhum pedido encontrado</div>
                          <div className="text-sm max-w-sm mx-auto leading-relaxed">
                            Não há pedidos com os filtros selecionados. Tente ajustar os critérios de busca ou criar um novo pedido.
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
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Painel de Administração • Total de {orders.length} pedidos listados</p>
        </div>
      </div>
    </div>
  );
}                                    
