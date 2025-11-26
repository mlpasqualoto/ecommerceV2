"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("https://ecommercev2-rg6c.onrender.com/api/users/me", {
          method: "GET",
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

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetch("https://ecommercev2-rg6c.onrender.com/api/users/logout", {
        method: "POST",
        credentials: "include",
      });

      // Redireciona para login independente do resultado
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, redireciona para login
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gradient-to-r from-gray-950 to-gray-800 text-white p-4 flex flex-col justify-between">
        {/* Seção superior */}
        <div>
          <h2 className="text-lg font-bold mb-4">Painel Admin</h2>
          <nav className="flex flex-col gap-2">
            <a
              href="/admin"
              className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
            >
              Pedidos
            </a>
            <a
              href="/admin/products"
              className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
            >
              Produtos
            </a>
            <a
              href="/admin/users"
              className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
            >
              Usuários
            </a>
          </nav>
        </div>

        {/* Seção inferior - Botão de Logout */}
        <div className="border-t border-gray-600 pt-4 mt-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className=" cursor-pointer w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-40 to-red-600 hover:from-red-600 hover:to-red-40 disabled:from-red-400 disabled:to-red-500 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group"
          >
            {isLoggingOut ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
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
                <span>Saindo...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
