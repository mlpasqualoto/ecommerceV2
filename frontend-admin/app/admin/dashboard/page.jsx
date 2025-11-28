"use client";
import { useState, useEffect } from "react";
import { fetchDashboardStats } from "../../lib/api.js";

export default function Dashboard() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [showRevenue, setShowRevenue] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [tooltipDay, setTooltipDay] = useState(null);
  const [tooltipMonth, setTooltipMonth] = useState(null);

  // Calcula startDate e endDate baseado no dateRange
  const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case "today":
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: endOfToday.toISOString().split('T')[0]
        };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          startDate: monthAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return {
          startDate: yearAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      default:
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
    }
  };

  // Carrega dados da API
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const response = await fetchDashboardStats(startDate, endDate);
      
      if (response && response.stats) {
        setDashboardData(response.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      delivered: "bg-green-50 text-green-700 border border-green-200",
      shipped: "bg-blue-50 text-blue-700 border border-blue-200",
      processing: "bg-amber-50 text-amber-700 border border-amber-200",
      pending: "bg-orange-50 text-orange-700 border border-orange-200",
      paid: "bg-emerald-50 text-emerald-700 border border-emerald-200"
    };
    return colors[status] || "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const getStatusText = (status) => {
    const texts = {
      delivered: "Entregue",
      shipped: "Enviado",
      processing: "Processando",
      pending: "Pendente",
      paid: "Pago",
      cancelled: "Cancelado"
    };
    return texts[status] || status;
  };

  // Loading state
  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Extrai dados da API
  const { revenue, orders, customers, products, charts, topProducts, recentOrders } = dashboardData;
  const ordersByDay = charts?.ordersByDay || [];
  const ordersByMonth = charts?.ordersByMonth || [];

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-opacity duration-700 ${
        isPageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Header */}
      <div className={`bg-white border-b border-slate-200 shadow-sm transform transition-transform duration-500 ${
        isPageLoaded ? "translate-y-0" : "-translate-y-4"
      }`}>
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fadeInLeft">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Dashboard Executivo
                </h1>
              </div>
              <p className="text-slate-600 max-w-2xl leading-relaxed">
                Visão completa do desempenho do seu e-commerce em tempo real
              </p>
            </div>

            <div className="flex items-center space-x-4 animate-fadeInRight">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              >
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
                <option value="year">Este Ano</option>
              </select>

              <button 
                onClick={loadDashboardData}
                className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card Receita */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <button
                onClick={() => setShowRevenue(!showRevenue)}
                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                {showRevenue ? (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Receita Total</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {showRevenue ? formatCurrency(revenue.today) : "R$ ••••••"}
            </div>
            <div className="flex items-center text-sm">
              <span className="text-slate-500">Período selecionado</span>
            </div>
          </div>

          {/* Card Pedidos */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp" style={{animationDelay: "0.1s"}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total de Pedidos</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {orders.today}
            </div>
            <div className="flex items-center text-sm">
              <span className="text-slate-500">Período selecionado</span>
            </div>
          </div>

          {/* Card Clientes */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp" style={{animationDelay: "0.2s"}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Clientes Ativos</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {customers.active}
            </div>
            <div className="flex items-center text-sm">
              <span className="text-purple-600 font-semibold">+{customers.new} novos</span>
              <span className="text-slate-500 ml-2">hoje</span>
            </div>
          </div>

          {/* Card Produtos */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp" style={{animationDelay: "0.3s"}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Produtos Cadastrados</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {products.total}
            </div>
            <div className="flex items-center text-sm">
              <span className="text-orange-600 font-semibold">{products.lowStock} em baixa</span>
              <span className="text-slate-500 ml-2">estoque</span>
            </div>
          </div>
        </div>

        {/* Grid de Gráficos e Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Status dos Pedidos */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Status dos Pedidos</h3>
            <div className="space-y-4">
              {Object.entries(orders.byStatus || {}).map(([status, count]) => (
                <div key={status} className={`flex items-center justify-between p-4 rounded-xl ${getStatusColor(status)}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${status === 'delivered' ? 'bg-green-500' : status === 'shipped' ? 'bg-blue-500' : status === 'paid' ? 'bg-emerald-500' : status === 'processing' ? 'bg-amber-500' : 'bg-orange-500'}`}></div>
                    <span className="text-sm font-medium text-slate-700">{getStatusText(status)}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Produtos Mais Vendidos */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Top 5 Produtos Mais Vendidos</h3>
            <div className="space-y-4">
              {(topProducts || []).slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.totalSales} vendas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{formatCurrency(product.totalRevenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráficos de Linha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico: Pedidos por Dia */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Pedidos por Dia (Última Semana)</h3>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Pedidos</span>
              </div>
            </div>
            
            {ordersByDay.length > 0 && (() => {
              // Calcula o valor máximo para escala dinâmica
              const maxOrders = Math.max(...ordersByDay.map(d => d.orders));
              const yScale = maxOrders > 0 ? maxOrders : 1;
              const yStep = Math.ceil(yScale / 4); // 4 divisões no eixo Y
              
              return (
                <div className="relative h-64">
                  <svg viewBox="0 0 400 200" className="w-full h-full">
                    <line x1="40" y1="0" x2="40" y2="160" stroke="#e2e8f0" strokeWidth="1"/>
                    <line x1="40" y1="160" x2="400" y2="160" stroke="#e2e8f0" strokeWidth="2"/>
                    
                    {/* Labels do eixo Y dinâmicos */}
                    <text x="30" y="10" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep * 4}</text>
                    <text x="30" y="50" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep * 3}</text>
                    <text x="30" y="90" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep * 2}</text>
                    <text x="30" y="130" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep}</text>
                    <text x="30" y="165" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>
                    
                    {/* Linhas de grade horizontais */}
                    <line x1="40" y1="40" x2="400" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    <line x1="40" y1="80" x2="400" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    <line x1="40" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    
                    <path
                      d={ordersByDay.map((data, idx) => 
                        `${idx === 0 ? 'M' : 'L'} ${60 + idx * 50},${160 - (data.orders / yScale) * 140}`
                      ).join(' ')}
                      fill="none"
                      stroke="url(#blueGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    <path
                      d={`${ordersByDay.map((data, idx) => 
                        `${idx === 0 ? 'M' : 'L'} ${60 + idx * 50},${160 - (data.orders / yScale) * 140}`
                      ).join(' ')} L ${60 + (ordersByDay.length - 1) * 50},160 L 60,160 Z`}
                      fill="url(#blueGradientArea)"
                      opacity="0.3"
                    />
                    
                    {ordersByDay.map((data, idx) => (
                      <g key={idx}>
                        <circle
                          cx={60 + idx * 50}
                          cy={160 - (data.orders / yScale) * 140}
                          r="4"
                          fill="#3b82f6"
                          className="cursor-pointer"
                          onMouseEnter={() => setTooltipDay(idx)}
                          onMouseLeave={() => setTooltipDay(null)}
                        />
                        <circle
                          cx={60 + idx * 50}
                          cy={160 - (data.orders / yScale) * 140}
                          r="12"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setTooltipDay(idx)}
                          onMouseLeave={() => setTooltipDay(null)}
                        />
                        <text
                          x={60 + idx * 50}
                          y="180"
                          fontSize="11"
                          fill="#64748b"
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          {new Date(data._id).toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </text>
                      </g>
                    ))}
                    
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                      <linearGradient id="blueGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {tooltipDay !== null && ordersByDay[tooltipDay] && (
                    <div 
                      className="absolute bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg"
                      style={{
                        left: `${((60 + tooltipDay * 50) / 400) * 100}%`,
                        top: `${((160 - (ordersByDay[tooltipDay].orders / yScale) * 140) / 200) * 100 - 25}%`,
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      <div className="text-center">
                        <div className="font-bold text-blue-300">
                          {new Date(ordersByDay[tooltipDay]._id).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short' 
                          })}
                        </div>
                        <div className="text-white mt-1">
                          {ordersByDay[tooltipDay].orders} pedidos
                        </div>
                        <div className="text-blue-200 text-[10px]">
                          {formatCurrency(ordersByDay[tooltipDay].revenue)}
                        </div>
                      </div>
                      <div 
                        className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid #0f172a'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Média diária:</span>
                <span className="font-semibold text-slate-900">
                  {ordersByDay.length > 0 
                    ? Math.round(ordersByDay.reduce((acc, d) => acc + d.orders, 0) / ordersByDay.length)
                    : 0} pedidos
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico: Pedidos por Mês */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Pedidos por Mês (Últimos 6 Meses)</h3>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Pedidos</span>
              </div>
            </div>
            
            {ordersByMonth.length > 0 && (() => {
              // Calcula o valor máximo para escala dinâmica
              const maxOrders = Math.max(...ordersByMonth.map(d => d.orders));
              const yScale = maxOrders > 0 ? maxOrders : 1;
              const yStep = Math.ceil(yScale / 4);
              
              return (
                <div className="relative h-64">
                  <svg viewBox="0 0 400 200" className="w-full h-full">
                    <line x1="40" y1="0" x2="40" y2="160" stroke="#e2e8f0" strokeWidth="1"/>
                    <line x1="40" y1="160" x2="400" y2="160" stroke="#e2e8f0" strokeWidth="2"/>
                    
                    {/* Labels do eixo Y dinâmicos */}
                    <text x="30" y="10" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep * 4}</text>
                    <text x="30" y="50" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep * 3}</text>
                    <text x="30" y="90" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep * 2}</text>
                    <text x="30" y="130" fontSize="10" fill="#94a3b8" textAnchor="end">{yStep}</text>
                    <text x="30" y="165" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>
                    
                    {/* Linhas de grade */}
                    <line x1="40" y1="40" x2="400" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    <line x1="40" y1="80" x2="400" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    <line x1="40" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    
                    <path
                      d={ordersByMonth.map((data, idx) => 
                        `${idx === 0 ? 'M' : 'L'} ${70 + idx * 60},${160 - (data.orders / yScale) * 140}`
                      ).join(' ')}
                      fill="none"
                      stroke="url(#purpleGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    <path
                      d={`${ordersByMonth.map((data, idx) => 
                        `${idx === 0 ? 'M' : 'L'} ${70 + idx * 60},${160 - (data.orders / yScale) * 140}`
                      ).join(' ')} L ${70 + (ordersByMonth.length - 1) * 60},160 L 70,160 Z`}
                      fill="url(#purpleGradientArea)"
                      opacity="0.3"
                    />
                    
                    {ordersByMonth.map((data, idx) => (
                      <g key={idx}>
                        <circle
                          cx={70 + idx * 60}
                          cy={160 - (data.orders / yScale) * 140}
                          r="4"
                          fill="#9333ea"
                          className="cursor-pointer"
                          onMouseEnter={() => setTooltipMonth(idx)}
                          onMouseLeave={() => setTooltipMonth(null)}
                        />
                        <circle
                          cx={70 + idx * 60}
                          cy={160 - (data.orders / yScale) * 140}
                          r="12"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setTooltipMonth(idx)}
                          onMouseLeave={() => setTooltipMonth(null)}
                        />
                        <text
                          x={70 + idx * 60}
                          y="180"
                          fontSize="11"
                          fill="#64748b"
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          {new Date(data._id + '-01').toLocaleDateString('pt-BR', { month: 'short' })}
                        </text>
                      </g>
                    ))}
                    
                    <defs>
                      <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#93333ea" />
                        <stop offset="100%" stopColor="#c026d3" />
                      </linearGradient>
                      <linearGradient id="purpleGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#93333ea" />
                        <stop offset="100%" stopColor="#93333ea" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {tooltipMonth !== null && ordersByMonth[tooltipMonth] && (
                    <div 
                      className="absolute bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg"
                      style={{
                        left: `${((70 + tooltipMonth * 60) / 400) * 100}%`,
                        top: `${((160 - (ordersByMonth[tooltipMonth].orders / yScale) * 140) / 200) * 100 - 25}%`,
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      <div className="text-center">
                        <div className="font-bold text-purple-300">
                          {new Date(ordersByMonth[tooltipMonth]._id + '-01').toLocaleDateString('pt-BR', { 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-white mt-1">
                          {ordersByMonth[tooltipMonth].orders} pedidos
                        </div>
                        <div className="text-purple-200 text-[10px]">
                          {formatCurrency(ordersByMonth[tooltipMonth].revenue)}
                        </div>
                      </div>
                      <div 
                        className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid #0f172a'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Média mensal:</span>
                <span className="font-semibold text-slate-900">
                  {ordersByMonth.length > 0
                    ? Math.round(ordersByMonth.reduce((acc, d) => acc + d.orders, 0) / ordersByMonth.length)
                    : 0} pedidos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pedidos Recentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Pedidos Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ID do Pedido</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(recentOrders || []).map((order, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-semibold text-slate-900">#{order._id?.slice(-8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">{order.userId?.name || order.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalhes">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
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
