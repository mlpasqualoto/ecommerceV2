"use client";
import { useEffect, useState } from "react";
import { fetchOrders } from "../../lib/api";

export default function AdminHome() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders().then((data) => setOrders(data.orders || []));
  }, []);

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
          {orders.map((order) => (
            <tr key={order._id} className="border-t">
              <td className="p-2">{order._id}</td>
              <td className="p-2">{order.userName}</td>
              <td className="p-2">{order.status}</td>
              <td className="p-2">R$ {order.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
