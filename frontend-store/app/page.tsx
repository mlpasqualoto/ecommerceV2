"use client";
import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cldUrl } from "@/lib/cld.js";
import { fetchProducts } from "@/lib/api.js";
import { ShoppingBag } from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);

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

        const allProducts = data.products || [];
        setProducts(allProducts);
        setFeaturedProducts(allProducts.slice(0, 4));
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
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <ShoppingBag className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">Carregando sua loja</h3>
          <p className="text-slate-400">Preparando os melhores produtos para você</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Sua <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Loja Online</span>
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-10 leading-relaxed">
              Descubra produtos incríveis com qualidade excepcional e entrega rápida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group bg-white text-slate-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-slate-100 transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                Ver Produtos
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                Saber Mais
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Entrega Rápida</h3>
              <p className="text-slate-600">Receba seus produtos em casa com agilidade e segurança</p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Compra Segura</h3>
              <p className="text-slate-600">Suas informações protegidas com a melhor tecnologia</p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Qualidade Premium</h3>
              <p className="text-slate-600">Produtos selecionados com os melhores padrões de qualidade</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20 px-6 bg-slate-50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                Produtos em <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Destaque</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Selecionamos especialmente para você os produtos mais populares e bem avaliados
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <a
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative mb-6 overflow-hidden rounded-2xl">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={cldUrl(product.images[0].public_id, { width: 400, height: 400 })}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 rounded-2xl">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex flex-col gap-2">
                        <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">(4.8)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-slate-800">
                        R$ {product.price.toFixed(2)}
                      </div>
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                        Comprar
                      </button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      {products.length > 4 && (
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Todos os Produtos</h2>
              <p className="text-xl text-slate-600">Explore nossa coleção completa</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.slice(4).map((product, index) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100"
                >
                  <div className="relative mb-4 overflow-hidden rounded-xl">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={cldUrl(product.images[0].public_id, { width: 300, height: 300 })}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="text-lg font-bold text-slate-800">
                      R$ {product.price.toFixed(2)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-slate-900 to-slate-800 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="container mx-auto text-center relative">
          <h2 className="text-4xl font-bold text-white mb-4">
            Fique por dentro das <span className="text-blue-400">novidades</span>
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Seja o primeiro a saber sobre lançamentos, promoções exclusivas e ofertas especiais
          </p>

          <div className="max-w-md mx-auto">
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 px-6 py-4 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
              />
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap">
                Inscrever-se
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
