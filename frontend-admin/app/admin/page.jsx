"use client";
import { useEffect, useState, Fragment, useRef } from "react";
import {
  fetchOrders,
  fetchOrderById,
  fetchOrderByDate,
  fetchCreateOrder,
  fetchUpdateOrder,
  fetchPayOrder,
  fetchShipOrder,
  fetchCancelOrder,
  fetchDeleteOrder,
  fetchOlistSync
} from "../lib/api.js";
import { formatCurrencyBRL } from "../utils/utils.js";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    productId: "",
    quantity: "",
    status: "",
    totalCost: "",
    totalAmount: "",
  });
  const [newOrder, setNewOrder] = useState({
    items: [{ productId: "", quantity: "" }],
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    orderId: null,
  });
  const [showRevenue, setShowRevenue] = useState(true);

  // usa data local (YYYY-MM-DD) — evita deslocamento por UTC
  const getLocalIsoDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // formato BR para exibição (DD/MM/YYYY)
  const formatBR = (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  const hiddenDateRef = useRef(null);
  const [orderDate, setOrderDate] = useState(getLocalIsoDate());
  const [systemStatus, setSystemStatus] = useState("loading"); // loading | online | unstable
  const router = useRouter();

  // Atualiza dados periodicamente
  useEffect(() => {
    // intervalo de 60s para atualizar só os dados
    const intervalId = setInterval(() => {
      handleRefreshDataTimer();
    }, 60000);

    return () => clearInterval(intervalId); // cleanup
  }, [orderDate, statusFilter, expandedOrder]); // Adiciona expandedOrder

  async function handleRefreshDataTimer() {
    try {
      // Busca dados sem alterar estados visuais
      const response = await fetchOrderByDate(orderDate);

      if (
        response?.message?.toLowerCase().includes("não autenticado") ||
        response?.error === "Unauthorized"
      ) {
        router.push("/login");
        return;
      }

      if (response?.orders) {
        let filteredOrders = response.orders;
        if (statusFilter !== "all") {
          filteredOrders = response.orders.filter(
            (order) => order.status === statusFilter
          );
        }
        setOrders(filteredOrders);
        setSystemStatus("online");
      } else {
        setSystemStatus("unstable");
      }
    } catch (err) {
      console.error("Erro ao atualizar pedidos:", err);
      setSystemStatus("unstable");
    }
  }

  // Função para recarregar/atualizar os dados manualmente
  async function handleRefreshData() {
    setLoading(true);
    setSystemStatus("loading");
    try {
      // Sincroniza com Olist antes de buscar (alimenta banco de dados)
      const formattedDate = formatBR(orderDate);    
      await fetchOlistSync(formattedDate, formattedDate);

      // Busca dados atualizados no banco de dados
      const data = await fetchOrderByDate(orderDate);

      // Define status do sistema baseado na resposta
      if (data && Array.isArray(data.orders)) {
        setSystemStatus("online");
      } else {
        setSystemStatus("unstable");
      }

      const refreshButton = document.querySelector("[data-refresh-btn]");
      refreshButton?.classList.add("animate-spin");
      setTimeout(() => {
        refreshButton?.classList.remove("animate-spin");
      }, 1000);
    } catch (err) {
      console.error("Erro ao atualizar pedidos:", err);
      setSystemStatus("unstable");
    } finally {
      setLoading(false);
      setExpandedOrder(null); // Fecha detalhes apenas no refresh manual
    }
  }

  // Função para exportar dados
  const handleExportData = () => {
    try {
      // ⚠️ CORREÇÃO: Detecta formato de número do sistema via Intl
      const testNumber = (234.56).toLocaleString();
      const usesComma = testNumber.includes(","); // true = vírgula decimal (BR/EU)

      // Define separadores baseado no formato detectado
      const decimalSeparator = usesComma ? "," : ".";
      const columnDelimiter = usesComma ? ";" : ",";

      console.log("📊 Separadores finais:", {
        decimal: decimalSeparator,
        coluna: columnDelimiter,
      });

      // Função helper para formatar números
      const formatNumber = (value) => {
        return value.toFixed(2).replace(".", decimalSeparator);
      };

      let count = 0;
      const exportData = orders.map((order) => {
        // 1. Verifica se o status conta para custos (apenas pagos/enviados/entregues)
        const isConfirmed = ["paid", "shipped", "delivered"].includes(order.status);

        // 2. Valores Base
        const totalAmount = order.totalAmount || 0;
        const totalQuantity = order.totalQuantity || 0;
        const totalCost = order.totalCost || 0;

        // 3. Cálculo da Taxa Shopee (20% + R$5 por item)
        const shopeeTax = isConfirmed 
          ? (totalAmount * 0.20) + (totalQuantity * 5.0) 
          : 0
        ;

        // 4. Custo considerado (apenas se confirmado)
        const consideredCost = isConfirmed ? totalCost : 0;

        // 5. Cálculo do Lucro Bruto
        // Fórmula: Total Recebido - (Taxa Shopee + Total Custo)
        // Se o pedido não estiver confirmado, o lucro é 0 (para não distorcer o relatório)
        const grossProfit = isConfirmed 
          ? totalAmount - (shopeeTax + consideredCost) 
          : 0
        ;

        // 6. Extração do ID Olist do nome do pedido
        const text = order.name; // usado para extração de ID Olist e nome cliente
        const regexOlistId = /Pedido Olist nº (\d+)/;
        const matchOlistId = text.match(regexOlistId);

        let olistId = "";
        if (matchOlistId && matchOlistId[1]) {
          olistId = matchOlistId[1];
        }

        //7. Extração do nome do cliente
        const regexClientName = /em nome de (.*?),/;
        const matchClientName = text.match(regexClientName);

        let clientName = "";
        if (matchClientName && matchClientName[1]) {
          clientName = matchClientName[1];
        }

        // 8. Extração do ID Ecommerce
        const regexEcommerceId = /- nº\s+(\S+)/; // ✅ Pega qualquer coisa após "- nº "
        const matchEcommerceId = text.match(regexEcommerceId);

        let ecommerceId = "";
        if (matchEcommerceId && matchEcommerceId[1]) {
          ecommerceId = matchEcommerceId[1];
        }

        return {
          Qte: ++count,
          ID: order._id,
          "ID Ecommerce": ecommerceId || "",
          "ID Olist": olistId || "",
          Data: new Date(order.createdAt).toLocaleDateString("pt-BR"),
          Cliente: clientName || "",
          Status: getStatusText(order.status),
          "Total Recebido": formatNumber(totalAmount),
          "Taxa Shopee": formatNumber(shopeeTax),
          "Total Custo": formatNumber(consideredCost),
          "Lucro Bruto": formatNumber(grossProfit),
          Produtos: order.items
            .map((item) => `${item.name} (${item.quantity}x)`)
            .join(", "),
          "Total de Itens": totalQuantity,
        }
    });

      const totalPaid = orders
        .filter((order) => order.status === "paid")
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const totalShipped = orders
        .filter((order) => order.status === "shipped")
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const totalDelivered = orders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const totalConfirmed = totalPaid + totalShipped + totalDelivered;

      // Soma custo de produção (usa order.totalCost se já vier do backend; senão calcula pelos itens)
      const totalProductionCost = orders
        .filter((order) =>
          ["paid", "shipped", "delivered"].includes(order.status)
        )
        .reduce((sum, order) => {
          if (typeof order.totalCost === "number") {
            return sum + order.totalCost;
          }
          const orderCost = (order.items || []).reduce(
            (s, item) =>
              s + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
            0
          );
          return sum + orderCost;
        }, 0);

      const escapeCSV = (value) => {
        if (value == null) return '""';
        const str = String(value);
        if (
          str.includes(columnDelimiter) ||
          str.includes('"') ||
          str.includes("\n") ||
          str.includes("\r")
        ) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
      };

      const commissionShopee = totalConfirmed * 0.2;
      // Soma a quantidade total de produtos vendidos para calcular a taxa fixa por pedido
      const quantityProducts = orders
        .filter((order) =>
          ["paid", "shipped", "delivered"].includes(order.status)
        )
        .reduce((sum, order) => {
          return sum + (order.totalQuantity || 0);
        }, 0);
      const shopeeRatePerOrder = quantityProducts * 5.0;

      // Cálculo do lucro bruto
      const grossProfit =
        totalConfirmed -
        commissionShopee -
        shopeeRatePerOrder -
        totalProductionCost;

      const csvContent = [
        // Cabeçalho da tabela de pedidos
        Object.keys(exportData[0] || {})
          .map(escapeCSV)
          .join(columnDelimiter),
        ...exportData.map((row) =>
          Object.values(row).map(escapeCSV).join(columnDelimiter)
        ),
        "",
        "",
        // ═══════════════════════════════════════════════════════════
        // RESUMO FINANCEIRO - LAYOUT HORIZONTAL
        // ═══════════════════════════════════════════════════════════
        escapeCSV(
          "═══════════════════════════════════════════════════════════"
        ),
        escapeCSV("RESUMO FINANCEIRO - ANÁLISE COMPLETA"),
        escapeCSV(
          "═══════════════════════════════════════════════════════════"
        ),
        "",
        // Cabeçalhos das colunas
        [
          escapeCSV("VOLUME DE PEDIDOS"),
          escapeCSV("RECEITAS"),
          escapeCSV("CUSTOS OPERACIONAIS"),
          escapeCSV("RESULTADO FINAL"),
          escapeCSV("MÉDIAS E INDICADORES"),
        ].join(columnDelimiter),
        "",
        // Linha 1
        [
          escapeCSV(
            "Total de Pedidos Confirmados: " +
              (orders.filter((order) =>
                ["paid", "shipped", "delivered"].includes(order.status)
              ).length || 0)
          ),
          escapeCSV("Receita Bruta Total: " + formatNumber(totalConfirmed)),
          escapeCSV("Taxa Shopee (20%): " + formatNumber(commissionShopee)),
          escapeCSV("LUCRO BRUTO: " + formatNumber(grossProfit)),
          escapeCSV(
            "Ticket Médio: " +
              formatNumber(
                totalConfirmed /
                  (orders.filter((order) =>
                    ["paid", "shipped", "delivered"].includes(order.status)
                  ).length || 1)
              )
          ),
        ].join(columnDelimiter),
        // Linha 2
        [
          escapeCSV("└─ Status: Pago + Enviado + Entregue"),
          escapeCSV("└─ Soma de todos os pedidos confirmados"),
          escapeCSV(
            "Taxa Shopee Fixa (R$5,00/item): " +
              formatNumber(shopeeRatePerOrder)
          ),
          escapeCSV("└─ (Receita - Taxas - Custos)"),
          escapeCSV("└─ (Receita Total / Qtd Pedidos)"),
        ].join(columnDelimiter),
        // Linha 3
        [
          escapeCSV(""),
          escapeCSV(""),
          escapeCSV(
            "Subtotal Taxas Shopee: " +
              formatNumber(commissionShopee + shopeeRatePerOrder)
          ),
          escapeCSV(
            "Margem de Lucro: " +
              formatNumber((grossProfit / totalConfirmed) * 100) +
              "%"
          ),
          escapeCSV(
            "Lucro Médio por Pedido: " +
              formatNumber(
                grossProfit /
                  (orders.filter((order) =>
                    ["paid", "shipped", "delivered"].includes(order.status)
                  ).length || 1)
              )
          ),
        ].join(columnDelimiter),
        // Linha 4
        [
          escapeCSV(""),
          escapeCSV(""),
          escapeCSV(
            "Custo de Produtos (Estoque): " + formatNumber(totalProductionCost)
          ),
          escapeCSV(""),
          escapeCSV("└─ (Lucro Bruto / Qtd Pedidos)"),
        ].join(columnDelimiter),
        // Linha 5
        [
          escapeCSV(""),
          escapeCSV(""),
          escapeCSV(
            "TOTAL DE CUSTOS: " +
              formatNumber(
                commissionShopee + shopeeRatePerOrder + totalProductionCost
              )
          ),
          escapeCSV(""),
          escapeCSV(
            "Custo Médio por Pedido: " +
              formatNumber(
                (commissionShopee + shopeeRatePerOrder + totalProductionCost) /
                  (orders.filter((order) =>
                    ["paid", "shipped", "delivered"].includes(order.status)
                  ).length || 1)
              )
          ),
        ].join(columnDelimiter),
        "",
        escapeCSV(
          "═══════════════════════════════════════════════════════════"
        ),
        escapeCSV("Relatório gerado em: " + new Date().toLocaleString("pt-BR")),
        escapeCSV(
          "═══════════════════════════════════════════════════════════"
        ),
      ].join("\n");

      // ⚠️ Adiciona BOM UTF-8 para Excel reconhecer encoding
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      // Garante data atual em UTC-3
      const currentDate = new Date();
      const currentDateBr = currentDate.setHours(currentDate.getHours() - 3); // Ajusta para o fuso horário de Brasília (UTC-3)

      link.setAttribute(
        "download",
        `pedidos_${orders[0].createdAt.split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const exportButton = document.querySelector("[data-export-btn]");
      exportButton?.classList.add("bg-green-200", "text-green-700");
      setTimeout(() => {
        exportButton?.classList.remove("bg-green-200", "text-green-700");
      }, 2000);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const openEditModal = (order) => {
    setEditOrder(order);
    setEditForm({
      productId: order.items[0].productId,
      quantity: order.items[0].quantity,
      status: order.status,
      totalCost: order.totalCost,
      totalAmount: order.totalAmount,
    });
  };

  const closeEditModal = () => {
    setEditOrder(null);
    setEditForm({
      productId: "",
      quantity: "",
      status: "",
      totalCost: "",
      totalAmount: "",
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      await handleUpdateOrder(editOrder._id, {
        productId: editForm.productId,
        quantity: Number(editForm.quantity),
        status: editForm.status,
        totalCost: Number(editForm.totalCost),
        totalAmount: Number(editForm.totalAmount),
      });
    } catch (err) {
      console.error("Erro ao atualizar pedido:", err);
    } finally {
      setLoading(false);
      closeEditModal();
    }
  };
  
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        await handleFilterByDate(orderDate);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      } finally {
        setLoading(false);
        toggleOrderDetails();
      }
    };

    loadOrders();
  }, [statusFilter, router, orderDate]);

  const handleFilterById = async (e) => {
    e.preventDefault();
    const orderId = e.target.elements.orderId.value;
    if (orderId) {
      const data = await fetchOrderById(orderId);
      if (
        data?.message?.toLowerCase().includes("não autenticado") ||
        data?.error === "Unauthorized"
      ) {
        router.push("/login");
        return;
      }

      if (!data.order) {
        setOrders([]);
      } else {
        setOrders([data.order]);
        toggleOrderDetails();
      }
    }
  };

  const handleFilterByStatus = async (status) => {
    if (!status) return null;

    const data = await fetchOrders(status);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return data;
    }

    if (!data.orders || data.orders.length === 0) {
      setOrders([]);
    } else {
      setOrders(data.orders);
      toggleOrderDetails();
    }

    return data;
  };

  const handleFilterByDate = async (date) => {
    if (!date) return null;

    const data = await fetchOrderByDate(date);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return data;
    }

    if (!data.orders || data.orders.length === 0) {
      setOrders([]);
    } else {
      let filteredOrders = [];
      if (statusFilter !== "all") {
        for (const order of data.orders) {
          if (order.status === statusFilter) {
            filteredOrders.push(order);
          }
        }
      } else {
        filteredOrders = data.orders;
      }
      setOrders(filteredOrders);
      toggleOrderDetails();
    }

    return data;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    const newOrderData = {
      items: newOrder.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
    };

    const data = await fetchCreateOrder(newOrderData);

    if (!data.order) {
      console.error("Pedido não foi criado corretamente:", data);
      return;
    }

    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }

    setOrders((prevOrders) => [...prevOrders, data.order]);
    setNewOrder({ items: [{ productId: "", quantity: "" }] });
    setIsCreateModalOpen(false);
  };

  const handleNewOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewOrderItemChange = (index, e) => {
    const { name, value } = e.target;
    setNewOrder((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index][name] = value;
      return { ...prev, items: updatedItems };
    });
  };

  const handleAddItem = () => {
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: "" }],
    }));
  };

  const handleRemoveItem = (index) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateOrder = async (orderId, updatedData) => {
    const data = await fetchUpdateOrder(orderId, updatedData);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...updatedData } : order
      )
    );
  };

  const handlePayOrder = async (orderId) => {
    const data = await fetchPayOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...data.order } : order
      )
    );
  };

  const handleShipOrder = async (orderId) => {
    const data = await fetchShipOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...data.order } : order
      )
    );
  };

  const handleCancelOrder = async (orderId) => {
    const data = await fetchCancelOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId ? { ...order, ...data.order } : order
      )
    );
  };

  const handleDeleteOrder = async (orderId) => {
    const data = await fetchDeleteOrder(orderId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order._id !== orderId)
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border border-amber-200",
      shipped: "bg-blue-50 text-blue-700 border border-blue-200",
      delivered: "bg-green-50 text-green-700 border border-green-200",
      cancelled: "bg-red-50 text-red-700 border border-red-200",
    };
    return (
      colors[status] || "bg-slate-50 text-slate-700 border border-slate-200"
    );
  };

  const getStatusText = (status) => {
    const texts = {
      paid: "Pago",
      pending: "Pendente",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return texts[status] || status;
  };

  // Utilitário para formatar createdAt exatamente (sem deslocar fuso)
  const formatCreatedAtDate = (createdAt) => {
    if (!createdAt) return "";
    // Usa a própria string ISO para pegar a parte da data (YYYY-MM-DD)
    // e exibir em DD/MM/YY
    const iso = String(createdAt);
    const [yyyy, mm, dd] = iso.split("T")[0].split("-");
    return `${dd}/${mm}/${yyyy.slice(2)}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  const renderSystemStatus = () => {
    if (systemStatus === "loading") {
      return (
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
          <span>Verificando...</span>
        </div>
      );
    }
    if (systemStatus === "online") {
      return (
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Sistema Online</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        <span>Instabilidade detectada</span>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-opacity duration-700 ${
        isPageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Header Principal - RESPONSIVO */}
      <div
        className={`bg-white border-b border-slate-200 shadow-sm transform transition-transform duration-500 ${
          isPageLoaded ? "translate-y-0" : "-translate-y-4"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Mobile: Stack vertical */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Título e descrição */}
            <div className="animate-fadeInLeft">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  Gerenciamento de Pedidos
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed hidden sm:block">
                Controle completo sobre todos os pedidos do seu e-commerce
              </p>

              {/* Status do sistema - Mobile compacto */}
              <div className="flex items-center space-x-4 mt-3 text-xs sm:text-sm">
                {renderSystemStatus()}
                <div className="flex items-center space-x-1 text-slate-500">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
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
                  <span className="hidden sm:inline">
                    Atualizado em tempo real
                  </span>
                  <span className="sm:hidden">Tempo real</span>
                </div>
              </div>
            </div>

            {/* Cards de estatísticas - Grid responsivo */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:items-center lg:space-x-4 animate-fadeInRight">
              {/* Card Total de Pedidos */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl">
                    <svg
                      className="w-7 h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 transition-all duration-300 hover:text-blue-600 leading-none">
                      {orders.length}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {orders.length === 1 ? 'pedido listado' : 'pedidos listados'}
                    </div>
                    <div className="flex items-center justify-end space-x-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Ativo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Receita Total */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-emerald-200 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-emerald-100 rounded-lg sm:rounded-xl mb-2 sm:mb-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-emerald-600"
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

                  <div className="flex-1 text-center sm:text-right">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">
                      {showRevenue ? (
                        formatCurrencyBRL(
                          orders
                            .filter((order) =>
                              ["paid", "shipped", "delivered"].includes(
                                order.status
                              )
                            )
                            .reduce((sum, order) => sum + order.totalAmount, 0)
                        )
                      ) : (
                        <span className="tracking-wider">R$ ••••</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      receita confirmada
                    </div>
                    <div className="flex items-center justify-end space-x-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-emerald-600 font-medium">
                        {
                          orders.filter((order) =>
                            ["paid", "shipped", "delivered"].includes(
                              order.status
                            )
                          ).length
                        }{" "}
                        pedidos
                      </span>
                    </div>
                  </div>

                  {/* Botão do olho */}
                  <button
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="mt-2 sm:mt-0 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 hover:bg-emerald-200 rounded-lg sm:rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    title={showRevenue ? "Ocultar receita" : "Mostrar receita"}
                  >
                    {showRevenue ? (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botões de ação - Mobile horizontal */}
              <div className="col-span-2 flex justify-center gap-3 sm:gap-4 lg:flex-col">
                <button
                  onClick={handleRefreshData}
                  data-refresh-btn
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  title="Sincronizar dados"
                  disabled={loading}
                >
                  <svg
                    className={`w-5 h-5 text-slate-600 ${
                      loading ? "animate-spin" : ""
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

                <button
                  onClick={handleExportData}
                  data-export-btn
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  title="Exportar relatório (CSV)"
                  disabled={orders.length === 0}
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Modal de Edição */}
        {editOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 transform animate-scaleIn">
              {/* Cabeçalho fixo */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Editar Pedido
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    ID: {editForm.productId}
                  </p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="cursor-pointer bg-red-50 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.1s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Produto ID
                  </label>
                  <input
                    name="productId"
                    type="text"
                    value={editForm.productId}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-sm transition-colors duration-200"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Quantidade
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    value={editForm.quantity}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-slate-900 hover:border-slate-300"
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.4s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Total Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    name="totalCost"
                    value={editForm.totalCost}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.4s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Total (R$)
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={editForm.totalAmount}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div
                  className="flex justify-end space-x-3 pt-6 animate-slideInUp"
                  style={{ animationDelay: "0.5s" }}
                >
                  <button
                    type="button"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                    onClick={closeEditModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 hover:shadow-xl"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Criação */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 transform animate-scaleIn">
              {/* Cabeçalho fixo */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Criar Novo Pedido
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Adicione um novo pedido ao sistema
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="cursor-pointer bg-red-50 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                {newOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-end">
                    <div
                      className="flex-1 space-y-2 animate-slideInUp"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <label className="block text-sm font-semibold text-slate-700">
                        Produto ID
                      </label>
                      <input
                        type="text"
                        name="productId"
                        value={item.productId}
                        onChange={(e) => handleNewOrderItemChange(idx, e)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 text-slate-900"
                        placeholder="Digite o ID do produto"
                        required
                      />
                    </div>

                    <div
                      className="w-32 space-y-2 animate-slideInUp"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <label className="block text-sm font-semibold text-slate-700">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleNewOrderItemChange(idx, e)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                        min="1"
                        required
                      />
                    </div>

                    {newOrder.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="cursor-pointer px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 animate-slideInUp"
                        style={{ animationDelay: "0.1s" }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="cursor-pointer mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  + Adicionar Produto
                </button>

                <div
                  className="flex justify-end space-x-3 pt-6 animate-slideInUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <button
                    type="button"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 transform hover:scale-105"
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

        {/* Modal de Confirmação de Exclusão */}
        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-fadeIn">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja excluir este pedido? Essa ação não pode
                ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({ open: false, orderId: null })
                  }
                  className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDeleteOrder(deleteConfirm.orderId);
                    setDeleteConfirm({ open: false, orderId: null });
                  }}
                  className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Controles - RESPONSIVA */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Desktop: Tudo em uma linha */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            {/* Busca por ID */}
            <form
              onSubmit={handleFilterById}
              className="flex items-center gap-2 flex-1"
            >
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Buscar por ID:
              </label>
              <input
                type="text"
                name="orderId"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                placeholder="ID do pedido..."
              />
              <button
                type="submit"
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl whitespace-nowrap cursor-pointer"
              >
                Buscar
              </button>
            </form>

            {/* Status */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm min-w-[150px] cursor-pointer placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
              >
                <option value="all">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            {/* Data */}
            <div className="flex items-center gap-2 relative">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Data:
              </label>
              {/* Input visível (formatado) */}
              <div className="relative min-w-[130px]">
                <input
                  type="text"
                  value={formatBR(orderDate)}
                  readOnly
                  placeholder="Selecione a data"
                  style={{ pointerEvents: 'none' }}
                  className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono cursor-pointer min-w-[130px] placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                />
                
                {/* Input date SOBREPOSTO (invisível mas clicável) */}
                <input
                  type="date"
                  ref={hiddenDateRef}
                  value={orderDate}
                  onChange={(e) => {
                    setOrderDate(e.target.value);
                    handleFilterByDate(e.target.value);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  style={{ WebkitAppearance: 'none' }}
                />
              </div>
            </div>

            {/* Botão Novo Pedido */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <svg
                className="w-4 h-4"
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
              Novo Pedido
            </button>
          </div>

          {/* Mobile: Layout empilhado */}
          <div className="lg:hidden space-y-4">
            {/* Busca por ID */}
            <form
              onSubmit={handleFilterById}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
            >
              <label className="text-xs sm:text-sm font-semibold text-slate-700">
                Buscar ID:
              </label>
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  name="orderId"
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-sm font-mono"
                  placeholder="ID do pedido..."
                />
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg sm:rounded-xl whitespace-nowrap"
                >
                  Buscar
                </button>
              </div>
            </form>

            {/* Filtros em grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 sm:px-4 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Data */}
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">
                  Data:
                </label>
                <input
                  type="date"
                  //ref={hiddenDateRef}
                  value={orderDate}
                  onChange={(e) => {
                    setOrderDate(e.target.value);
                    handleFilterByDate(e.target.value);
                  }}
                  className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono cursor-pointer min-w-[130px] placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Botão Novo Pedido */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg sm:rounded-xl flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
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
              Novo Pedido
            </button>
          </div>
        </div>

        {/* Tabela - MOBILE: Cards, DESKTOP: Table */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Desktop: Tabela tradicional */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Data & Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Qtd
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length > 0 ? (
                  orders.map((order, idx) =>
                    order ? (
                      <Fragment key={order._id || idx}>
                        {/* Linha Principal */}
                        <tr
                          key={order._id || idx}
                          className="hover:bg-slate-50 transition-all duration-200 group animate-fadeInUp"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-slate-900 transition-colors duration-200 group-hover:text-blue-600">
                              {formatCreatedAtDate(order.createdAt)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(order.createdAt).toLocaleString(
                                "pt-BR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "UTC", // Exibe a hora UTC SEM conversão
                                }
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="mb-1">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-10 h-10 object-cover rounded-lg mr-2 inline-block align-middle"
                                  />
                                )}
                                <div className="inline-block align-middle">
                                  <div className="text-sm font-semibold text-slate-900 max-w-[200px] truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono">
                                    {item.productId} • Qtd: {item.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 text-sm font-bold rounded-full transition-all duration-200 group-hover:bg-blue-100 group-hover:text-blue-700">
                              {order.totalQuantity}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-2">
                              {/* Nome do E-commerce (userName) com visual similar ao status */}
                              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 max-w-fit">
                                {order.source || "Cliente"}
                              </span>
                              
                              {/* Informações originais do cliente */}
                              <div className="text-sm font-semibold text-slate-900 max-w-[150px] truncate">
                                {order.name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {order.userId}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusText(order.status)}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="text-sm font-bold text-slate-900 transition-colors duration-200 group-hover:text-emerald-600">
                              {formatCurrencyBRL(order.totalAmount)}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="cursor-pointer p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                onClick={() => openEditModal(order)}
                                title="Editar pedido"
                              >
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                                </svg>
                              </button>

                              <button
                                className="cursor-pointer p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    orderId: order._id,
                                  })
                                }
                                title="Deletar pedido"
                              >
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                                </svg>
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <button
                              className="cursor-pointer p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                              onClick={() => toggleOrderDetails(order._id)}
                              title={
                                expandedOrder === order._id
                                  ? "Ocultar detalhes"
                                  : "Ver detalhes"
                              }
                            >
                              <svg
                                className={`w-4 h-4 transition-transform duration-300 ${
                                  expandedOrder === order._id
                                    ? "rotate-180"
                                    : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Linha de Detalhes Expandida */}
                        {expandedOrder === order._id && (
                          <tr
                            key={`${order._id}-details`}
                            className="bg-slate-50 animate-slideDown"
                          >
                            <td colSpan="10" className="px-6 py-6">
                              <div className="bg-white rounded-xl p-6 border border-slate-200 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {/* Informações do Pedido */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.1s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Informações do Pedido
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          ID do Pedido
                                        </label>
                                        <p className="text-sm font-mono text-slate-900">
                                          #{order._id}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Descrição do Pedido
                                        </label>
                                        <p className="text-sm text-slate-900 space-y-1">
                                          {order.name}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Produtos
                                        </label>
                                        <ul className="text-sm text-slate-900 space-y-1 font-semibold">
                                          {order.items.map((item, idx) => (
                                            <li key={idx}>
                                              - {item.name} — {item.quantity}x (
                                              {formatCurrencyBRL(item.price)})
                                              <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-[11px] ml-1">
                                                -{item.discount}%
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Total, Pagamento e Endereço */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.2s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Total, Pagamento e Endereço
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Total preço de custo
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {formatCurrencyBRL(order.totalCost)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Total a pagar
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {formatCurrencyBRL(order.totalAmount)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Forma de pagamento
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {order.paymentMethod || "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Endereço de entrega
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {order.shippingAddress}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status e Data */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.3s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Status e Datas
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Status Atual
                                        </label>
                                        <div className="mt-1">
                                          <span
                                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${getStatusColor(
                                              order.status
                                            )}`}
                                          >
                                            {getStatusText(order.status)}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Criado em
                                        </label>
                                        <p className="text-sm text-slate-900">
                                          {new Date(
                                            order.createdAt
                                          ).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            timeZone: "UTC", // Exibe a hora UTC SEM conversão
                                          })}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Pago em
                                        </label>
                                        <p className="text-sm text-slate-900">
                                          {new Date({
                                            /* data de pagamento */
                                          }).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Ações Rápidas */}
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-4">
                                    Ações Rápidas de Status
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="cursor-pointer px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() => handlePayOrder(order._id)}
                                      title="Marcar como pago"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-credit-card"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M0 4a2 2 0 0 1 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
                                        <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                      </svg>
                                      Pagar
                                    </button>

                                    <button
                                      className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() => handleShipOrder(order._id)}
                                      title="Enviar pedido"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-truck"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0  0 0 1 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
                                      </svg>
                                      Enviar
                                    </button>

                                    <button
                                      className="cursor-pointer px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() =>
                                        handleCancelOrder(order._id)
                                      }
                                      title="Cancelar pedido"
                                    >
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
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ) : null
                  )
                ) : (
                  <tr key="no-orders">
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4 animate-fadeIn">
                        <div className="relative">
                          <svg
                            className="w-16 h-16 text-slate-300 animate-pulse"
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
                          <div className="absolute inset-0 bg-slate-300/30 rounded-full animate-ping"></div>
                        </div>
                        <div
                          className="text-slate-500 animate-slideInUp"
                          style={{ animationDelay: "0.2s" }}
                        >
                          <div className="text-lg font-semibold mb-2">
                            Nenhum pedido encontrado
                          </div>
                          <div className="text-sm max-w-sm mx-auto leading-relaxed">
                            Não há pedidos com os filtros selecionados. Tente
                            ajustar os critérios de busca ou criar um novo
                            pedido.
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {orders.length > 0 ? (
              orders.map((order, idx) =>
                order ? (
                  <div
                    key={order._id || idx}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Cabeçalho do card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {formatCreatedAtDate(order.createdAt)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            }
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    {/* Produtos */}
                    <div className="mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              Qtd: {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cliente e Total */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                      <div className="text-sm text-slate-600 truncate flex-1">
                        {order.name}
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrencyBRL(order.totalAmount)}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                        </svg>
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({ open: true, orderId: order._id })
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                        </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => toggleOrderDetails(order._id)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        {expandedOrder === order._id ? "Ocultar" : "Detalhes"}
                      </button>
                    </div>

                    {/* Detalhes expandidos */}
                    {expandedOrder === order._id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-slideDown">
                        <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                            ID do Pedido
                          </div>
                          <div className="text-sm font-mono text-slate-900">
                            #{order._id}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                            Endereço
                          </div>
                          <div className="text-sm text-slate-900">
                            {order.shippingAddress}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                            Pagamento
                          </div>
                          <div className="text-sm text-slate-900">
                            {order.paymentMethod || "N/A"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={() => handlePayOrder(order._id)}
                            className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-medium"
                          >
                            Pagar
                          </button>
                          <button
                            onClick={() => handleShipOrder(order._id)}
                            className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium"
                          >
                            Enviar
                          </button>
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null
              )
            ) : (
              <div className="p-8 text-center">
                <svg
                  className="w-12 h-12 text-slate-300 mx-auto mb-3"
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
                <div className="text-slate-500">
                  <div className="font-semibold mb-1">
                    Nenhum pedido encontrado
                  </div>
                  <div className="text-sm">
                    Tente ajustar os filtros de busca
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs sm:text-sm text-slate-500">
          <p>Painel de Administração • Total de {orders.length} pedidos listados</p>
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
