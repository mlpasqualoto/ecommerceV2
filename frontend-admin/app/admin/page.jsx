"use client";
import { useEffect, useState } from "react";
import { fetchOrders } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("paid"); // estado do filtro
  const router = useRouter();

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

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pedidos</h1>

      {/* Filtro de status */}
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
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order._id} className="border-t">
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
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="p-4 text-center text-gray-500">
                Nenhum pedido encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
