import Order from "../models/Order";
import User from "../models/User";
import Product from "../models/Product";
import {
  AnalyticsServiceResult,
  ReportServiceResult
} from "../types/analyticsTypes";

// **** ESTATÍSTICAS DO DASHBOARD **** //

// Buscar estatísticas do dashboard
export async function getDashBoardsStatsService(startDate: string, endDate: string): Promise<AnalyticsServiceResult> {
  // Valida e converte datas
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Início do dia

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Fim do dia

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      status: 400,
      message: "Datas inválidas. Use formato ISO (YYYY-MM-DD).",
      stats: undefined
    };
  }

  // 1. Total de Receita e Pedidos
  const orderStats = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  // 2. Pedidos por Status
  const ordersByStatus = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // 3. Pedidos por Dia (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const ordersByDay = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: '%Y-%m-%d', 
            date: '$createdAt',
            timezone: 'America/Sao_Paulo' // ✅ Horário de São Paulo
          }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 3.1. Pedidos por Dia do Mês (ÚLTIMOS 12 MESES) ⚠️ AJUSTADO
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const ordersByDayOfMonth = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: twelveMonthsAgo } // ⚠️ Busca últimos 12 meses
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 4. Pedidos por Mês (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const ordersByMonth = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 4.1. Receita por Dia (últimos 7 dias)
  const revenueByDay = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 4.2. Pedidos por Hora do Dia (últimas 24h)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const ordersByHour = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: last24Hours }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%H', date: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 4.3. Taxa de Conversão por Status
  const conversionRateAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalOrdersInRange = (conversionRateAgg as any[]).reduce((sum: number, item: any) => sum + (item.count || 0), 0);
  const successfulOrders = (conversionRateAgg as any[]).reduce((sum: number, item: any) => {
    const status = item._id;
    if (['paid', 'shipped', 'delivered'].includes(status)) {
      return sum + (item.count || 0);
    }
    return sum;
  }, 0);
  const conversionRate = totalOrdersInRange ? (successfulOrders / totalOrdersInRange) : 0;

  // 5. Top Produtos Mais Vendidos
  const topProducts = await Order.aggregate([
    { $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        totalSales: { $sum: '$items.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: ['$items.quantity', '$items.price']
          }
        }
      }
    },
    { $sort: { totalSales: -1 } },
    { $limit: 5 }
  ]);

  // 6. Estatísticas de Clientes
  const customerStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: {
          $sum: {
            $cond: [
              { $gte: ['$lastOrderDate', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // 7. Novos clientes hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newCustomersToday = await User.countDocuments({
    createdAt: { $gte: today }
  });

  // 8. Estatísticas de Produtos
  const productStats = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        lowStock: {
          $sum: { $cond: [{ $lt: ['$stock', 10] }, 1, 0] }
        },
        outOfStock: {
          $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
        }
      }
    }
  ]);

  // 9. Pedidos Recentes
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'name email')
    .lean();

  // Extrai valores com fallback seguro
  const orderStatsData = orderStats[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
  const customerStatsData = customerStats[0] || { totalCustomers: 0, activeCustomers: 0 };
  const productStatsData = productStats[0] || { totalProducts: 0, lowStock: 0, outOfStock: 0 };

  return {
    status: 200,
    message: "Estatísticas do dashboard recuperadas com sucesso",
    stats: {
      revenue: {
        today: orderStatsData.totalRevenue,
        total: orderStatsData.totalRevenue
      },
      orders: {
        today: orderStatsData.totalOrders,
        total: orderStatsData.totalOrders,
        avgValue: orderStatsData.avgOrderValue || 0,
        byStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      },
      customers: {
        total: customerStatsData.totalCustomers,
        active: customerStatsData.activeCustomers,
        new: newCustomersToday
      },
      products: {
        total: productStatsData.totalProducts,
        lowStock: productStatsData.lowStock,
        outOfStock: productStatsData.outOfStock
      },
      charts: {
        ordersByDay,
        ordersByDayOfMonth, // ⚠️ Agora contém últimos 12 meses
        ordersByMonth,
        revenueByDay,
        ordersByHour,
        conversionRate
      },
      topProducts,
      recentOrders
    }
  };
};


// **** RELATÓRIOS DE VENDAS **** //

// Gerar relatórios de vendas
/**
 * Gera relatório semanal de vendas
 * @param weekYear - Formato: "2024-W50" (ano-semana)
 */
export async function getWeeklyReportService(weekYear: string): Promise<ReportServiceResult> {
  try {
    if (!weekYear || !weekYear.includes('-W')) {
      return {
        status: 400,
        message: "Formato de semana inválido. Use formato YYYY-WNN (ex: 2024-W50)",
        report: undefined
      };
    }

    const [year, weekStr] = weekYear.split("-W");
    
    if (!year || !weekStr) {
      return {
        status: 400,
        message: "Formato de semana inválido",
        report: undefined
      };
    }

    const week = parseInt(weekStr);
    const yearNum = parseInt(year);

    if (isNaN(week) || isNaN(yearNum) || week < 1 || week > 53) {
      return {
        status: 400,
        message: "Semana deve estar entre 1 e 53",
        report: undefined
      };
    }

    // const startDate = getDateOfISOWeek(week, parseInt(year));
    const startDate = getDateOfISOWeek(week, yearNum);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return await generateReport(startDate, endDate, "weekly", weekYear);
  } catch (error) {
    console.error("Erro em getWeeklyReportService:", error);
    return {
      status: 400,
      message: error instanceof Error ? error.message : "Erro ao gerar relatório semanal",
      report: undefined
    };
  }
}

/**
 * Gera relatório mensal de vendas
 * @param monthYear - Formato: "2024-12" (ano-mês)
 */
export async function getMonthlyReportService(monthYear: string): Promise<ReportServiceResult> {
  try {
    if (!monthYear || !monthYear.includes('-')) {
      return {
        status: 400,
        message: "Formato de mês inválido. Use formato YYYY-MM (ex: 2024-12)",
        report: undefined
      };
    }

    const [year, month] = monthYear.split("-");
    
    if (!year || !month) {
      return {
        status: 400,
        message: "Formato de mês inválido",
        report: undefined
      };
    }
 
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
 
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return {
        status: 400,
        message: "Mês deve estar entre 1 e 12",
        report: undefined
      };
    }

    // Primeiro dia do mês
    const startDate = new Date(yearNum, monthNum - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // Último dia do mês
    const endDate = new Date(yearNum, monthNum, 0);
    endDate.setHours(23, 59, 59, 999);

    return await generateReport(startDate, endDate, "monthly", monthYear);
  } catch (error) {
    console.error("Erro em getMonthlyReportService:", error);
    return {
      status: 400,
      message: error instanceof Error ? error.message : "Erro ao gerar relatório mensal",
      report: undefined
    };
  }
}

/**
 * Função auxiliar para gerar o relatório completo
 */
async function generateReport(
  startDate: Date,
  endDate: Date,
  type: "weekly" | "monthly",
  period: string
): Promise<ReportServiceResult> {

  console.log(`📊 Gerando relatório ${type}:`, {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateLocal: startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    endDateLocal: endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  });

  // 1. Resumo Financeiro e de Pedidos
  const summary = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  const summaryData = summary[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  };

  console.log(`📈 Resumo encontrado:`, summaryData);

  // 2. Vendas por Dia (dentro do período)
  const salesByDay = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: '%Y-%m-%d', 
            date: '$createdAt',
            timezone: 'America/Sao_Paulo'
          }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  console.log(`📅 Vendas por dia encontradas:`, salesByDay.length);

  // Formata para incluir nome do dia da semana
  const salesByDayFormatted = salesByDay.map((day: any) => {
    const date = new Date(day._id + 'T00:00:00-03:00');
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      date: day._id,
      day: dayNames[date.getDay()],
      orders: day.orders,
      revenue: day.revenue
    };
  });

  // 3. Melhor dia de vendas
  const bestDay = salesByDayFormatted.reduce((best: any, current: any) => {
    if (!current || typeof current.revenue !== 'number') return best;
    return current.revenue > (best?.revenue || 0) ? current : best;
  }, null);

  console.log(`🏆 Melhor dia:`, bestDay);

  // 4. Top Produtos Mais Vendidos
  const topProducts = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: {
          $sum: {
            $multiply: ['$items.quantity', '$items.price']
          }
        }
      }
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 }
  ]);

  console.log(`🏆 Top produtos encontrados:`, topProducts.length);

  // 5. Pedidos por Status
  const ordersByStatus = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const ordersByStatusObj = ordersByStatus.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // 6. Comparação com período anterior (growth)
  const periodDuration = endDate.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - periodDuration);
  const previousEndDate = new Date(startDate.getTime() - 1);

  const previousPeriod = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: previousStartDate, $lte: previousEndDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  const previousRevenue = previousPeriod[0]?.totalRevenue || 0;
  const growth = previousRevenue > 0
    ? (((summaryData.totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
    : "0";

  // 7. Vendas por Categoria (se houver)
  const salesByCategory = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$productInfo.category',
        revenue: {
          $sum: {
            $multiply: ['$items.quantity', '$items.price']
          }
        },
        quantity: { $sum: '$items.quantity' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // 8. Horário de pico de vendas
  const salesByHour = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: '%H', 
            date: '$createdAt',
            timezone: 'America/Sao_Paulo' 
          }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const peakHour = salesByHour.reduce((peak: any, current: any) => {
    return current.orders > (peak?.orders || 0) ? current : peak;
  }, null);

  // 9. Taxa de conversão (pedidos pagos/total)
  const totalOrdersInPeriod = await Order.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const conversionRate = totalOrdersInPeriod > 0
    ? ((summaryData.totalOrders / totalOrdersInPeriod) * 100).toFixed(1)
    : "0";

  // 10. Novos clientes no período
  const newCustomers = await User.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  return {
    status: 200,
    message: "Relatório gerado com sucesso",
    report: {
      period,
      type,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        startFormatted: startDate.toLocaleDateString('pt-BR'),
        endFormatted: endDate.toLocaleDateString('pt-BR')
      },
      summary: {
        totalRevenue: summaryData.totalRevenue,
        totalOrders: summaryData.totalOrders,
        avgOrderValue: summaryData.avgOrderValue,
        topProduct: topProducts[0]?.name || 'N/A',
        bestDay: bestDay?.day || 'N/A',
        bestDayDate: bestDay?.date || null,
        growth: parseFloat(growth),
        conversionRate: parseFloat(conversionRate),
        newCustomers,
        peakHour: peakHour?._id ? `${peakHour._id}:00` : 'N/A'
      },
      salesByDay: salesByDayFormatted,
      topProducts: topProducts.map((p: any) => ({
        name: p.name,
        quantity: p.quantity,
        revenue: p.revenue
      })),
      ordersByStatus: ordersByStatusObj,
      salesByCategory: salesByCategory.map((c: any) => ({
        category: c._id || 'Sem categoria',
        revenue: c.revenue,
        quantity: c.quantity
      })),
      salesByHour: salesByHour.map((h: any) => ({
        hour: `${h._id}:00`,
        orders: h.orders,
        revenue: h.revenue
      })),
      comparison: {
        previousPeriodRevenue: previousRevenue,
        difference: summaryData.totalRevenue - previousRevenue,
        growthPercentage: parseFloat(growth)
      }
    }
  };
}

/**
 * Função auxiliar CORRIGIDA para obter data do início da semana ISO
 */
function getDateOfISOWeek(week: number, year: number): Date {
  // 4 de janeiro sempre está na semana 1 ISO
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Domingo = 7 (ISO)
  
  // Calcula segunda-feira da semana 1
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1);
  
  // Adiciona semanas
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);
  
  return weekStart;
}

/**
 * Exporta relatório para CSV
 */
export function exportReportToCSV(reportData: any): string {
  const headers = ['Data', 'Pedidos', 'Receita'];
  const rows = reportData.salesByDay.map((day: any) =>
    [day.date, day.orders, day.revenue].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Compara dois períodos
 */
export async function comparePeriodsService(
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
): Promise<ReportServiceResult> {

  const p1Start = new Date(period1Start);
  const p1End = new Date(period1End);
  const p2Start = new Date(period2Start);
  const p2End = new Date(period2End);

  const period1Data = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: p1Start, $lte: p1End }
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    }
  ]);

  const period2Data = await Order.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'shipped', 'delivered'] },
        createdAt: { $gte: p2Start, $lte: p2End }
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    }
  ]);

  const p1 = period1Data[0] || { revenue: 0, orders: 0 };
  const p2 = period2Data[0] || { revenue: 0, orders: 0 };

  return {
    status: 200,
    message: "Comparação gerada com sucesso",
    report: {
      period1: {
        revenue: p1.revenue,
        orders: p1.orders,
        dateRange: { start: p1Start, end: p1End }
      },
      period2: {
        revenue: p2.revenue,
        orders: p2.orders,
        dateRange: { start: p2Start, end: p2End }
      },
      comparison: {
        revenueDifference: p1.revenue - p2.revenue,
        revenueGrowth: p2.revenue > 0 ? ((p1.revenue - p2.revenue) / p2.revenue * 100).toFixed(2) : 0,
        ordersDifference: p1.orders - p2.orders,
        ordersGrowth: p2.orders > 0 ? ((p1.orders - p2.orders) / p2.orders * 100).toFixed(2) : 0
      }
    }
  };
}
