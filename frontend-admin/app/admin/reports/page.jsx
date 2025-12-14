"use client";
import { useState, useEffect, useCallback } from "react";
// ✅ Importe as funções do seu arquivo de API
import { 
  fetchWeeklyReport, 
  fetchMonthlyReport, 
  exportReportCSV, 
  downloadCSV 
} from "../../lib/api"; 

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

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      const period = reportType === "weekly" ? selectedWeek : selectedMonth;
      let data;

      // ✅ Usa as funções do api.js (que já tratam auth e erros)
      if (reportType === "weekly") {
        data = await fetchWeeklyReport(period);
      } else {
        data = await fetchMonthlyReport(period);
      }

      if (!data || data.status !== 200 || !data.report) {
        console.error("Erro ao carregar relatório:", data?.message);
        setReportData(null);
        return;
      }

      setReportData(data.report);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedWeek, selectedMonth]);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

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
      const period = reportType === "weekly" ? selectedWeek : selectedMonth;
      const result = await exportReportCSV(reportType, period);

      // ✅ CORREÇÃO: Valida se é Blob
      if (!(result instanceof Blob)) {
        console.error("Erro ao exportar:", result);
        return;
      }

      const filename = `relatorio-${reportType}-${period}.csv`;
      downloadCSV(result, filename);
    } catch (error) {
      console.error("Erro no download:", error);
    }
  };

  const printReport = () => {
    window.print();
  };

  if (loading || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-opacity duration-700 ${
        isPageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Header */}
      <div
        className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transform transition-transform duration-500 ${
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Relatórios de Vendas
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Análise detalhada de desempenho e métricas do seu e-commerce
              </p>
            </div>

            <div className="flex items-center space-x-4 animate-fadeInRight">
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <button
                  onClick={() => setReportType("weekly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    reportType === "weekly"
                      ? "bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setReportType("monthly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    reportType === "monthly"
                      ? "bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Mensal
                </button>
              </div>

              {reportType === "weekly" && (
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-900 dark:text-white"
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
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-900 dark:text-white"
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
                className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors duration-200"
                title="Imprimir"
              >
                <svg
                  className="w-5 h-5 text-slate-600 dark:text-slate-400"
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
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>+{reportData?.summary?.growth || 0}%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Receita Total</h3>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {formatCurrency(reportData?.summary?.totalRevenue || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">No período selecionado</div>
          </div>

          <div
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total de Pedidos</h3>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {reportData?.summary?.totalOrders || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">Pedidos processados</div>
          </div>

          <div
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Ticket Médio</h3>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {formatCurrency(reportData?.summary?.avgOrderValue || 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">Por pedido</div>
          </div>

          <div
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Melhor Dia</h3>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {reportData?.bestDay?.day || "-"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">
              {reportData?.bestDay?.revenue 
                ? formatCurrency(reportData.bestDay.revenue) 
                : "Sem dados"}
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendas por Dia */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Vendas por Dia
            </h3>
            <div className="relative h-64">
              {reportData?.salesByDay && reportData.salesByDay.length > 0 ? (
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  <line x1="40" y1="160" x2="400" y2="160" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1.5" />
                  <line x1="40" y1="0" x2="40" y2="160" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1.5" />

                  {[0, 40, 80, 120, 160].map((y, idx) => (
                    <line key={idx} x1="40" y1={y} x2="400" y2={y} className="stroke-slate-100 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="2,2" />
                  ))}

                  {reportData.salesByDay.map((item, idx) => {
                    const maxRevenue = Math.max(...reportData.salesByDay.map(d => d.revenue));
                    const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 140 : 0;
                    const x = 70 + idx * 50;
                    
                    return (
                      <g key={idx}>
                        <rect x={x - 15} y={160 - barHeight} width="30" height={barHeight} fill="url(#blueGradient)" rx="4" className="cursor-pointer transition-opacity hover:opacity-80" />
                        <text x={x} y="180" fontSize="11" className="fill-slate-500 dark:fill-slate-400" textAnchor="middle" fontWeight="500">
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
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  Sem dados para exibir
                </div>
              )}
            </div>
          </div>

          {/* Status dos Pedidos */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Status dos Pedidos
            </h3>
            <div className="space-y-4">
              {reportData?.ordersByStatus && Object.entries(reportData.ordersByStatus).map(([status, count]) => {
                const total = Object.values(reportData.ordersByStatus).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                
                const statusConfig = {
                  delivered: { 
                    bg: "bg-green-50 dark:bg-green-900/20", 
                    text: "text-green-700 dark:text-green-400", 
                    bar: "bg-green-500", 
                    border: "border-green-200 dark:border-green-800/30",
                    label: "Entregue" 
                  },
                  shipped: { 
                    bg: "bg-blue-50 dark:bg-blue-900/20", 
                    text: "text-blue-700 dark:text-blue-400", 
                    bar: "bg-blue-500", 
                    border: "border-blue-200 dark:border-blue-800/30",
                    label: "Enviado" 
                  },
                  paid: { 
                    bg: "bg-emerald-50 dark:bg-emerald-900/20", 
                    text: "text-emerald-700 dark:text-emerald-400", 
                    bar: "bg-emerald-500", 
                    border: "border-emerald-200 dark:border-emerald-800/30",
                    label: "Pago" 
                  },
                  pending: { 
                    bg: "bg-orange-50 dark:bg-orange-900/20", 
                    text: "text-orange-700 dark:text-orange-400", 
                    bar: "bg-orange-500", 
                    border: "border-orange-200 dark:border-orange-800/30",
                    label: "Pendente" 
                  },
                  cancelled: { 
                    bg: "bg-red-50 dark:bg-red-900/20", 
                    text: "text-red-700 dark:text-red-400", 
                    bar: "bg-red-500", 
                    border: "border-red-200 dark:border-red-800/30",
                    label: "Cancelado" 
                  }
                };
                
                const config = statusConfig[status] || { 
                  bg: "bg-gray-50 dark:bg-gray-800", 
                  text: "text-gray-700 dark:text-gray-400", 
                  bar: "bg-gray-500", 
                  border: "border-gray-200 dark:border-gray-700",
                  label: status 
                };

                return (
                  <div key={status} className={`p-4 rounded-xl ${config.bg} border ${config.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${config.bar}`}></div>
                        <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{count}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-white dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${config.bar} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Produtos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Top 5 Produtos Mais Vendidos
          </h3>
          <div className="space-y-4">
            {reportData?.topProducts && reportData.topProducts.length > 0 ? (
              reportData.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} unidades vendidas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(product.revenue)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                Nenhum produto vendido no período
              </div>
            )}
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
