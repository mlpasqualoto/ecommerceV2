"use client";
import { useEffect, useState, Fragment } from "react";
import { fetchUsers, fetchUserById, fetchUsersByRole, fetchCreateUser } from "../../lib/api.js";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: "",
    userName: "",
    password: "",
    email: "",
    number: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("user");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        let data;

        if (statusFilter === "all") {
          data = await fetchUsers();
        } else {
          data = await fetchUsersByRole(statusFilter);
        }

        if (
          data?.message?.toLowerCase().includes("não autenticado") ||
          data?.error === "Unauthorized"
        ) {
          router.push("/login");
          return;
        }

        setUsers(data.users || []);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [statusFilter, router]);

  // Animação de entrada da página
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Função para recarregar/atualizar os dados
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      let data;

      if (statusFilter === "all") {
        data = await fetchUsers();
      } else {
        data = await fetchUsersByRole(statusFilter);
      }

      if (
        data?.message?.toLowerCase().includes("não autenticado") ||
        data?.error === "Unauthorized"
      ) {
        router.push("/login");
        return;
      }

      setUsers(data.users || []);

      // Feedback visual de sucesso
      const refreshButton = document.querySelector("[data-refresh-btn]");
      refreshButton?.classList.add("animate-spin");
      setTimeout(() => {
        refreshButton?.classList.remove("animate-spin");
      }, 1000);
    } catch (err) {
      console.error("Erro ao atualizar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterById = async (e) => {
    e.preventDefault();
    const userId = e.target.userId.value;
    if (!userId) return;

    setLoading(true);
    try {
      const data = await fetchUserById(userId);
      
      console.log("Dados retornados da API:", data);

      if (
        data?.message?.toLowerCase().includes("não autenticado") ||
        data?.error === "Unauthorized"
      ) {
        router.push("/login");
        return;
      }

      // suporta ambos os formatos de retorno
      if (data.user) {
        // Caso 1: Retornou usuário único (busca por ObjectId)
        setUsers([data.user]);
      } else if (data.users && data.users.length > 0) {
        // Caso 2: Retornou array de usuários (busca por userName/email/name)
        setUsers(data.users);
      } else {
        // Caso 3: Nenhum usuário encontrado
        setUsers([]);
      }
    } catch (err) {
      console.error("Erro ao buscar usuário:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    const newUserData = {
      name: newUser.name,
      userName: newUser.userName,
      password: newUser.password,
      email: newUser.email,
      number: newUser.number,
      role: newUser.role,
    };

    const data = await fetchCreateUser(newUserData);

    if (!data.user) {
      console.error("Usuário não foi criado corretamente:", data);
      return;
    }

    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }

    setUsers((prevUsers) => [...prevUsers, data.user]);
    setNewUser({
      name: "",
      userName: "",
      password: "",
      email: "",
      number: "",
      role: "",
    });
    setIsCreateModalOpen(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-opacity duration-700 ${isPageLoaded ? "opacity-100" : "opacity-0"
        }`}
    >
      {/* Header Principal */}
      <div
        className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transform transition-transform duration-500 ${isPageLoaded ? "translate-y-0" : "-translate-y-4"
          }`}
      >
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Gerenciamento de Usuários
                </h1>
              </div>

              <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Controle completo sobre todos os usuários do seu e-commerce.
                Visualize e gerencie cada usuário.
              </p>

              {/* Indicadores visuais */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Sistema Online</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Atualizado em tempo real</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 animate-fadeInRight">
              {/* Card de estatísticas melhorado */}
              <div className="bg-gradient-to-r from-slate-50 dark:from-slate-800 to-blue-50 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  {/* Ícone de usuários */}
                  <div className="flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <svg
                      className="w-7 h-7 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>

                  {/* Números e descrição */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 leading-none">
                      {users.length}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {users.length === 1
                        ? "usuário listado"
                        : "usuários listados"}
                    </div>
                    <div className="flex items-center justify-end space-x-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Ativo
                      </span>
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
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors duration-200 group cursor-pointer"
                  title="Atualizar dados"
                  disabled={loading}
                >
                  <svg
                    className={`w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-all duration-200 ${loading ? "animate-spin" : ""
                      }`}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-8 py-8">
        {/* Modal de Criação */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 transform animate-scaleIn">

              {/* Cabeçalho fixo */}
              <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Criar Novo Usuário</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Adicione um novo usuário ao sistema</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="cursor-pointer bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-2 rounded-full shadow-sm hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-300 hover:scale-110 transition-all duration-200"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.1s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleNewUserChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                    placeholder="Digite o nome do usuário"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Senha
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                    min="1"
                    placeholder="Digite a senha do usuário"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Username
                  </label>
                  <input
                    type="text"
                    name="userName"
                    value={newUser.userName}
                    onChange={handleNewUserChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                    min="1"
                    placeholder="Digite o username do usuário"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.4s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                    min="1"
                    placeholder="Digite o email do usuário"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.5s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Número de Telefone
                  </label>
                  <input
                    type="number"
                    name="number"
                    value={newUser.number}
                    onChange={handleNewUserChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                    min="1"
                    placeholder="Digite o número de telefone do usuário"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.6s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={newUser.role}
                    onChange={handleNewUserChange}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                    min="1"
                    placeholder="Digite a role do usuário"
                    required
                  />
                </div>

                <div
                  className="flex justify-end space-x-3 pt-6 animate-slideInUp"
                  style={{ animationDelay: "0.7s" }}
                >
                  <button
                    type="button"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-200 transform hover:scale-105"
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

        {/* Barra de Controles */}
        <div
          className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 transform transition-all duration-500 hover:shadow-md ${isPageLoaded
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
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Buscar por ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="userId"
                    className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-mono min-w-[200px] placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                    placeholder="ID do usuário..."
                  />
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    Buscar
                  </button>
                </div>
              </form>

              {/* Filtro por Role */}
              <div
                className="flex items-center gap-3 animate-slideInUp"
                style={{ animationDelay: "0.3s" }}
              >
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Filtrar por Role:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium min-w-[140px] text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </div>

            {/* Botão Novo Usuário */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg flex items-center gap-2 whitespace-nowrap transform hover:scale-105 hover:shadow-xl animate-slideInUp"
              style={{ animationDelay: "0.4s" }}
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
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Tabela de Usuários Otimizada */}
        <div
          className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all duration-500 hover:shadow-md ${isPageLoaded
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
            }`}
          style={{ transitionDelay: "0.2s" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.length > 0 ? (
                  users.map((user, idx) =>
                    user ? (
                      <Fragment key={user._id || idx}>
                        {/* Linha Principal */}
                        <tr
                          key={user._id || idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all duration-200 group animate-fadeInUp"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {user.userName}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                #{user._id}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="text-sm text-slate-900 dark:text-slate-100">
                              {user.name}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm text-slate-900 dark:text-slate-100">
                              {user.email}
                            </div>
                          </td>
                          <td>
                            <div id="user-role" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {user.role}
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ) : null
                  )
                ) : (
                  <tr key="no-users">
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4 animate-fadeIn">
                        <div className="relative">
                          <svg
                            className="w-16 h-16 text-slate-300 dark:text-slate-600 animate-pulse"
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
                          <div className="absolute inset-0 bg-slate-300/30 dark:bg-slate-600/30 rounded-full animate-ping"></div>
                        </div>
                        <div
                          className="text-slate-500 dark:text-slate-400 animate-slideInUp"
                          style={{ animationDelay: "0.2s" }}
                        >
                          <div className="text-lg font-semibold mb-2">
                            Nenhum usuário encontrado
                          </div>
                          <div className="text-sm max-w-sm mx-auto leading-relaxed">
                            Não há usuários com o id buscado. Tente ajustar os
                            critérios de busca ou criar um novo usuário.
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
          className={`mt-8 text-center text-sm text-slate-500 dark:text-slate-400 animate-fadeIn ${isPageLoaded ? "opacity-100" : "opacity-0"
            }`}
          style={{ transitionDelay: "0.3s" }}
        >
          <p>
            Painel de Administração • Total de {users.length} usuários listados
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
