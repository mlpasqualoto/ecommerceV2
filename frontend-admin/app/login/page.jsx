"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1️⃣ Faz login
      const loginRes = await fetch("http://localhost:5500/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // para receber cookie HTTP-only
        body: JSON.stringify({ userName, password }),
      });

      if (!loginRes.ok) {
        const data = await loginRes.json();
        setError(data.message || "Erro ao fazer login");
        return;
      }

      // 2️⃣ Verifica role após login
      const meRes = await fetch("http://localhost:5500/api/users/me", {
        credentials: "include",
      });

      if (!meRes.ok) {
        setError("Erro ao verificar permissões");
        return;
      }

      const userData = await meRes.json();

      if (userData.role !== "admin") {
        setError("Você não tem permissão para acessar esta área");
        return;
      }

      // ✅ Admin → vai para área restrita
      router.push("/admin");

    } catch (err) {
      setError("Erro de conexão com o servidor");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Painel Administrativo
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 p-3 w-full rounded-lg outline-none transition"
            placeholder="Usuário"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <input
            className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 p-3 w-full rounded-lg outline-none transition"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg w-full font-semibold shadow-md transition"
          >
            Entrar
          </button>
        </form>
        <div className="p-6 bg-red-500 text-white rounded-xl">
          Tailwind funcionando!
        </div>

        {error && (
          <p className="text-red-500 mt-4 text-center font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
