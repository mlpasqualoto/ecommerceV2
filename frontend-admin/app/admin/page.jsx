"use client";
import { useEffect, useState } from "react";
import { fetchOrders, fetchOrderById, fetchCreateOrder, fetchUpdateOrder, fetchPayOrder, fetchCancelOrder, fetchDeleteOrder } from "../../lib/api.js";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const [editOrder, setEditOrder] = useState(null); // pedido em edição
  const [editForm, setEditForm] = useState({ productId: '', quantity: '', status: '', totalAmount: '' });
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: "" });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("paid"); // estado do filtro
  const router = useRouter();

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
  }, [statusFilter, router]); // recarrega sempre que o filtro mudar

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

    // adiciona o novo pedido à lista
    setOrders((prevOrders) => [...prevOrders, data.order]);

    // limpa form
    setNewOrder({ productId: "", quantity: "" });
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

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pedidos</h1>

      {/* Modal de edição de pedido */}
      {editOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="text-xl font-bold mb-4">Editar Pedido</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Produto ID:</label>
                <input
                  name="productId"
                  type="text"
                  value={editForm.productId}
                  readOnly
                  className="border p-2 rounded w-full mb-2 bg-gray-100"
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Quantidade:</label>
                <input
                  name="quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={handleEditFormChange}
                  className="border p-2 rounded w-full mb-2"
                  min="1"
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Status:</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditFormChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Total:</label>
                <input
                  type="number"
                  name="totalAmount"
                  value={editForm.totalAmount}
                  onChange={handleEditFormChange}
                  className="border p-2 rounded w-full"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button type="button" className="mr-2 p-2 bg-gray-400 text-white rounded" onClick={closeEditModal}>Cancelar</button>
                <button type="submit" className="p-2 bg-blue-500 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de criação de pedido */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="text-xl font-bold mb-4">Criar Pedido</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Produto ID:</label>
                <input
                  type="text"
                  name="productId"
                  value={newOrder.productId}
                  onChange={handleNewOrderChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Quantidade:</label>
                <input
                  type="number"
                  name="quantity"
                  value={newOrder.quantity}
                  onChange={handleNewOrderChange}
                  className="border p-2 rounded w-full"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="mr-2 p-2 bg-gray-400 text-white rounded"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="p-2 bg-blue-500 text-white rounded">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtro de status e por ID */}
      <div className="mb-4">
        <label htmlFor="status" className="mr-2 font-semibold">
          Filtrar por status:
        </label>
        <select
          id="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {/* Formulário para filtrar por ID */}
        <form onSubmit={handleFilterById} className="inline">
          <label htmlFor="orderId" className="ml-4 font-semibold">
            Filtrar por ID:
          </label>
          <input
            type="text"
            id="orderId"
            name="orderId"
            className="border p-2 rounded ml-2"
            placeholder="Digite o ID do pedido"
          />
          <button type="submit" className="ml-2 p-2 bg-blue-500 text-white rounded">
            Filtrar
          </button>
        </form>
      </div>

      {/* Botão modal de criação de pedido */}
      <div className="mb-4">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="p-2 bg-green-600 text-white rounded"
        >
          Adicionar Pedido
        </button>
      </div>

      {/* Tabela */}
      <table className="bg-white shadow rounded w-full">
        <thead>
          <tr>
            <th className="p-2">Order ID</th>
            <th className="p-2">Order Data</th>
            <th className="p-2">Produto ID</th>
            <th className="p-2">Produto</th>
            <th className="p-2">Quantidade</th>
            <th className="p-2">Preço Unitário</th>
            <th className="p-2">Comprador ID</th>
            <th className="p-2">Comprador</th>
            <th className="p-2">Status</th>
            <th className="p-2">Total</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? orders.map((order, idx) => (
            order ? (
              <tr key={order._id || idx} className="border-t">
                <td className="p-2">{order._id}</td>
                <td className="p-2">
                  {new Date(order.createdAt).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-2">{order.items[0].productId}</td>
                <td className="p-2">{order.items[0].name}</td>
                <td className="p-2">{order.items[0].quantity}</td>
                <td className="p-2">{order.items[0].price}</td>
                <td className="p-2">{order.userId}</td>
                <td className="p-2">{order.name}</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">R$ {order.totalAmount}</td>
                <td className="p-2">
                  <button className="p-1 bg-yellow-500 text-white rounded" onClick={() => openEditModal(order)}>Editar</button>
                  <button className="p-1 bg-green-500 text-white rounded ml-1" onClick={() => handlePayOrder(order._id)}>Pagar</button>
                  <button className="p-1 bg-red-500 text-white rounded ml-1" onClick={() => handleCancelOrder(order._id)}>Cancelar</button>
                  <button className="p-1 bg-red-500 text-white rounded ml-1" onClick={() => handleDeleteOrder(order._id)}>Deletar</button>
                </td>
              </tr>
            ) : null
          )) : (
            <tr>
              <td colSpan="11" className="p-4 text-center text-gray-500">
                Nenhum pedido encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
