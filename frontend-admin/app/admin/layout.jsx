"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Lista de rotas públicas
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  const isPublicRoute = publicRoutes.includes(pathname);

  const checkAuth = useCallback(async (isBackgroundCheck = false) => {
    // 1. Evita loop se já estiver no login
    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

    try {
      // TÉCNICA CACHE BUSTER:
      // Adicionamos ?t=timestamp para garantir que a requisição seja sempre única.
      // Isso evita cache SEM precisar enviar headers que quebram o CORS.
      const timestamp = new Date().getTime();
      
      const res = await fetch(`https://ecommercev2-rg6c.onrender.com/api/users/me?t=${timestamp}`, {
        method: "GET",
        credentials: "include",
      });

      // Se der 401/403 e não estivermos no login, redireciona
      if (res.status === 401 || res.status === 403) {
        if (!isPublicRoute) {
          console.warn("Sessão expirada. Redirecionando...");
          router.push("/login");
        }
        return;
      }

      if (!res.ok) {
        // Se for outro erro, lançamos para cair no catch, mas sem forçar logout imediato se for erro de servidor
        throw new Error(`Erro na API: ${res.status}`);
      }

      const data = await res.json();

      if (data.role !== "admin") {
        router.push("/login");
        return;
      }

    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      
      // Lógica de segurança: Se falhar o fetch (ex: rede off) não desloga imediatamente
      // a menos que seja explicitamente um erro de auth tratado acima.
      // Mas para garantir segurança, se o usuário tentar navegar e der erro,
      // você pode optar por redirecionar ou mostrar um aviso.
      
      // Neste caso, se for erro de rede, mantemos o usuário na tela, 
      // mas se a resposta foi processada acima como 401, ele já foi redirecionado.
    } finally {
      if (!isBackgroundCheck) {
        setIsLoading(false);
      }
    }
  }, [router, pathname, isPublicRoute]);

  useEffect(() => {
    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

    // Verificação inicial
    checkAuth(false);

    // Polling a cada 60s
    const intervalId = setInterval(() => {
      checkAuth(true);
    }, 60000); 

    // Verificação ao focar na janela
    const handleFocus = () => checkAuth(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAuth, isPublicRoute]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("https://ecommercev2-rg6c.onrender.com/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigate = (path) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    {
      path: "/admin",
      label: "Pedidos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: "/admin/products",
      label: "Produtos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      path: "/admin/users",
      label: "Usuários",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: "/admin/reports",
      label: "Relatórios",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a11 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-white border-r border-slate-200 
          flex flex-col shadow-lg lg:shadow-sm
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Admin Panel</h2>
                <p className="text-xs text-slate-500">Gerenciamento</p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                pathname === item.path
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className={`transition-transform duration-200 ${
                pathname === item.path ? "" : "group-hover:scale-110"
              }`}>
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.label}</span>
              {pathname === item.path && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                  Sistema
                </div>
                <div className="text-sm font-semibold text-slate-900">Online</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Saindo...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sair</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">Admin Panel</span>
          </div>

          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        body:has(.mobile-menu-open) {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
