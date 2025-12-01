import Order from "../models/Order";
import User from "../models/User";
import Product from "../models/Product";
import {
    AnalyticsServiceResult
} from "../types/analyticsTypes";

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
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
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