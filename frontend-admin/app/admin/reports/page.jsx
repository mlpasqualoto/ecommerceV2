"use client";
import { useState, useEffect } from "react";

export default function Reports() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [reportType, setReportType] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-W${String(getWeekNumber(now)).padStart(2, "0")}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  const loadReportData = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const period = reportType === "weekly" ? selectedWeek : selectedMonth;
      const endpoint = reportType === "weekly" 
        ? `${API_BASE_URL}/reports/weekly/${period}`
        : `${API_BASE_URL}/reports/monthly/${period}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar relatório: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 200 && data.report) {
        setReportData(data.report);
      } else {
        throw new Error(data.message || 'Erro ao carregar relatório');
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
      // Em caso de erro, mantém dados vazios ou exibe mensagem
      alert("Erro ao carregar relatório. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadReportData();
  }, [reportType, selectedWeek, selectedMonth]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const getAvailableWeeks = () => {
    const weeks = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      const weekNum = getWeekNumber(date);
      const value = `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      const label = `Semana ${weekNum} - ${date.getFullYear()}`;
      weeks.push({ value, label });
    }
    return weeks;
  };

  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      months.push({ value, label });
    }
    return months;
  };

  const downloadReport = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const period = reportType === "weekly" ? selectedWeek : selectedMonth;
      const endpoint = reportType === "weekly" 
        ? `${API_BASE_URL}/reports/weekly/${period}/export`
        : `${API_BASE_URL}/reports/monthly/${period}/export`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio-${reportType}-${period}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      alert('Erro ao exportar relatório. Por favor, tente novamente.');
    }
  };

  const printReport = () => {
    window.print();
  };

  if (loading || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-opacity duration-700 ${
        isPageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Header */}
      <div
        className={`bg-white border-b border-slate-200 shadow-sm transform transition-transform duration-500 ${
          isPageLoaded ? "translate-y-0" : "-translate-y-4"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fadeInLeft">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
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
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Relatórios de Vendas
                </h1>
              </div>
              <p className="text-slate-600 max-w-2xl leading-relaxed">
                Análise detalhada de desempenho e métricas do seu e-commerce
              </p>
            </div>

            <div className="flex items-center space-x-4 animate-fadeInRight">
              <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setReportType("weekly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    reportType === "weekly"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setReportType("monthly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    reportType === "monthly"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mensal
                </button>
              </div>

              {reportType === "weekly" && (
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                >
                  {getAvailableWeeks().map((week) => (
                    <option key={week.value} value={week.value}>
                      {week.label}
                    </option>
                  ))}
                </select>
              )}

              {reportType === "monthly" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                >
                  {getAvailableMonths().map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={printReport}
                className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200"
                title="Imprimir"
              >
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </button>

              <button
                onClick={downloadReport}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>+{reportData.summary.growth}%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Receita Total</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {formatCurrency(reportData.summary.totalRevenue)}
            </div>
            <div className="text-xs text-slate-500">No período selecionado</div>
          </div>

          <div
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total de Pedidos</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {reportData.summary.totalOrders}
            </div>
            <div className="text-xs text-slate-500">Pedidos processados</div>
          </div>

          <div
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Ticket Médio</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {formatCurrency(reportData.summary.avgOrderValue)}
            </div>
            <div className="text-xs text-slate-500">Por pedido</div>
          </div>

          <div
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Melhor Dia</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {reportData.summary.bestDay}
            </div>
            <div className="text-xs text-slate-500">Maior volume de vendas</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendas por Dia */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Vendas por Dia
            </h3>
            <div className="relative h-64">
              <svg viewBox="0 0 400 200" className="w-full h-full">
                <line x1="40" y1="160" x2="400" y2="160" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="40" y1="0" x2="40" y2="160" stroke="#cbd5e1" strokeWidth="1.5" />

                {[0, 40, 80, 120, 160].map((y, idx) => (
                  <line
                    key={idx}
                    x1="40"
                    y1={y}
                    x2="400"
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                ))}

                {reportData.salesByDay.map((item, idx) => {
                  const maxRevenue = Math.max(...reportData.salesByDay.map(d => d.revenue));
                  const barHeight = (item.revenue / maxRevenue) * 140;
                  const x = 70 + idx * 50;
                  
                  return (
                    <g key={idx}>
                      <rect
                        x={x - 15}
                        y={160 - barHeight}
                        width="30"
                        height={barHeight}
                        fill="url(#blueGradient)"
                        rx="4"
                        className="cursor-pointer transition-opacity hover:opacity-80"
                      />
                      <text
                        x={x}
                        y="180"
                        fontSize="11"
                        fill="#64748b"
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        {item.day}
                      </text>
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Status dos Pedidos */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Status dos Pedidos
            </h3>
            <div className="space-y-4">
              {Object.entries(reportData.ordersByStatus).map(([status, count]) => {
                const total = Object.values(reportData.ordersByStatus).reduce((a, b) => a + b, 0);
                const percentage = ((count / total) * 100).toFixed(1);
                const colors = {
                  delivered: { bg: "bg-green-50", text: "text-green-700", bar: "bg-green-500", label: "Entregue" },
                  shipped: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-500", label: "Enviado" },
                  processing: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500", label: "Processando" },
                  pending: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500", label: "Pendente" }
                };
                const color = colors[status];

                return (
                  <div key={status} className={`p-4 rounded-xl ${color.bg} border border-${status === 'delivered' ? 'green' : status === 'shipped' ? 'blue' : status === 'processing' ? 'amber' : 'orange'}-200`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${color.bar}`}></div>
                        <span className={`text-sm font-medium ${color.text}`}>{color.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900">{count}</span>
                        <span className="text-xs text-slate-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${color.bar} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Produtos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Top 5 Produtos Mais Vendidos
          </h3>
          <div className="space-y-4">
            {reportData.topProducts.map((product, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.quantity} unidades vendidas</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(product.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>
        {`
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

          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
