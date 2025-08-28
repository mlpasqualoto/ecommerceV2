"use client";
import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { cldUrl } from "@/lib/cld.js";
import { fetchProducts } from "@/lib/api.js";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();

        if (
          data?.message?.toLowerCase().includes("não autenticado") ||
          data?.error === "Unauthorized"
        ) {
          return;
        }

        setProducts(data.products || []);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-screen h-dvh bg-white/95 backdrop-blur-sm flex items-center justify-center z-[9999] text-[#1a73e8] text-xl">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="relative">
            <i className="fa-solid fa-spinner animate-spin text-4xl"></i>
            <div className="absolute inset-0 rounded-full animate-ping"></div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Carregando produtos...</div>
            <div className="text-sm text-slate-500 mt-1">
              Aguarde um momento
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Loja Online</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <a
            key={product._id}
            href={`/produto/${product._id}`}
            className="border rounded-lg p-4 hover:shadow-lg"
          >
            {product.images && product.images.length > 0 ? (
              <Image
                src={cldUrl(product.images[0].public_id, { width: 400, height: 400 })}
                alt={product.name}
                width={400}
                height={400}
                className="w-full h-40 object-cover rounded"
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center bg-gray-100 text-gray-400 rounded">
                Sem imagem
              </div>
            )}

            <h2 className="font-semibold mt-2">{product.name}</h2>
            <p className="text-gray-600">R$ {product.price.toFixed(2)}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
