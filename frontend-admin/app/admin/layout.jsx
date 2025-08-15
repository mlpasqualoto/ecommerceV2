"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5500/api/users/me", {
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();

        if (data.role !== "admin") {
          router.push("/login");
          return;
        }

      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-800 text-white p-4">
        <h2 className="text-lg font-bold mb-4">Painel Admin</h2>
        <nav className="flex flex-col gap-2">
          <a href="/admin">Pedidos</a>
          <a href="/admin/products">Produtos</a>
          <a href="/admin/users">Usuários</a>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
