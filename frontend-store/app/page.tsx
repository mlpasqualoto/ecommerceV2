"use client";
import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cldUrl } from "@/lib/cld.js";
import { fetchProducts } from "@/lib/api.js";
import { ShoppingBag, Star, Truck, Shield, Zap, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slides do carousel principal
  const heroSlides = [
    {
      id: 1,
      title: "Coleção Verão 2025",
      subtitle: "Até 50% OFF",
      description: "Os melhores produtos para você arrasar no verão",
      buttonText: "Ver Coleção",
      image: "/api/placeholder/1200/600",
      gradient: "from-orange-500 to-pink-600"
    },
    {
      id: 2,
      title: "Tecnologia de Ponta",
      subtitle: "Últimos Lançamentos",
      description: "Descubra os produtos mais inovadores do mercado",
      buttonText: "Explorar",
      image: "/api/placeholder/1200/600",
      gradient: "from-blue-600 to-purple-700"
    },
    {
      id: 3,
      title: "Frete Grátis",
      subtitle: "Para Todo Brasil",
      description: "Em compras acima de R$ 200,00",
      buttonText: "Aproveitar",
      image: "/api/placeholder/1200/600",
      gradient: "from-green-500 to-teal-600"
    }
  ];

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
        setFeaturedProducts(allProducts.slice(0, 8));
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Auto-slide do carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

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
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${index === currentSlide ? 'translate-x-0' : index < currentSlide ? '-translate-x-full' : 'translate-x-full'
              }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`}>
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="container mx-auto px-4 h-full flex items-center">
                <div className="max-w-2xl text-white">
                  <h2 className="text-sm md:text-base font-medium mb-2 text-blue-200">
                    {slide.subtitle}
                  </h2>
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 text-blue-100 leading-relaxed">
                    {slide.description}
                  </p>
                  <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-slate-100 transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                    {slide.buttonText}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Entrega Rápida</h3>
              <p className="text-slate-600">Receba seus produtos em casa com agilidade e segurança</p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Compra Segura</h3>
              <p className="text-slate-600">Suas informações protegidas com a melhor tecnologia</p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Qualidade Premium</h3>
              <p className="text-slate-600">Produtos selecionados com os melhores padrões de qualidade</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                Produtos em <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Destaque</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Selecionamos especialmente para você os produtos mais populares e bem avaliados
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <Link
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
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">(4.8)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-slate-800">
                        R$ {product.price?.toFixed(2) || '0.00'}
                      </div>
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                        Comprar
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Explore por Categoria</h2>
            <p className="text-xl text-slate-600">Encontre exatamente o que você está procurando</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Eletrônicos", icon: "📱", color: "from-blue-500 to-cyan-500", items: "150+ produtos" },
              { name: "Moda", icon: "👕", color: "from-pink-500 to-rose-500", items: "200+ produtos" },
              { name: "Casa & Jardim", icon: "🏡", color: "from-green-500 to-emerald-500", items: "120+ produtos" },
              { name: "Esportes", icon: "⚽", color: "from-orange-500 to-amber-500", items: "80+ produtos" },
              { name: "Beleza", icon: "💄", color: "from-purple-500 to-violet-500", items: "90+ produtos" },
              { name: "Livros", icon: "📚", color: "from-indigo-500 to-purple-500", items: "300+ produtos" },
              { name: "Brinquedos", icon: "🧸", color: "from-yellow-500 to-orange-500", items: "75+ produtos" },
              { name: "Automotivo", icon: "🚗", color: "from-gray-600 to-slate-600", items: "60+ produtos" }
            ].map((category, index) => (
              <Link
                key={category.name}
                href={`/categoria/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.items}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      {products.length > 8 && (
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Todos os Produtos</h2>
              <p className="text-xl text-slate-600">Explore nossa coleção completa</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.slice(8).map((product, index) => (
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
                      R$ {product.price?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                Ver Todos os Produtos
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">O que nossos clientes dizem</h2>
            <p className="text-xl text-slate-600">Avaliações reais de quem já comprou conosco</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Silva",
                rating: 5,
                comment: "Excelente atendimento e produtos de qualidade. Recomendo!",
                avatar: "👩‍💼"
              },
              {
                name: "João Santos",
                rating: 5,
                comment: "Entrega rápida e produto exatamente como descrito. Muito satisfeito!",
                avatar: "👨‍💻"
              },
              {
                name: "Ana Costa",
                rating: 5,
                comment: "Melhor loja online que já comprei. Preços justos e qualidade excepcional.",
                avatar: "👩‍🎨"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{testimonial.name}</h4>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
