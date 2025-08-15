"use client";
import { useEffect, useState } from "react";
import { fetchOrders } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders("paid");

        // se backend retornar erro de autenticação
        if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
          router.push("/login"); // redireciona para login
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
  }, [router]);

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pedidos</h1>
      <table className="bg-white shadow rounded w-full">
        <thead>
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Usuário</th>
            <th className="p-2">Status</th>
            <th className="p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order._id} className="border-t">
                <td className="p-2">{order._id}</td>
                <td className="p-2">{order.userName}</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">R$ {order.totalAmount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-500">
                Nenhum pedido encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
