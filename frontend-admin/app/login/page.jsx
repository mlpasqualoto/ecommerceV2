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
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Login Admin</h1>
        <form onSubmit={handleLogin}>
          <input
            className="border p-2 w-full mb-3"
            placeholder="Usuário"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <input
            className="border p-2 w-full mb-3"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            Entrar
          </button>
        </form>
        {error && <p className="text-red-500 mt-3">{error}</p>}
      </div>
    </div>
  );
}
