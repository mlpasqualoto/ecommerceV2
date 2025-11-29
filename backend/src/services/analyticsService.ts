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
                message: "Datas inválidas. Use formato ISO (YYYY-MM-DD)."
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
        sevenDaysAgo.setHours(0, 0, 0, 0); // Meia-noite local
        // Ajusta para UTC-3 (adiciona 3 horas ao UTC para compensar)
        const sevenDaysAgoUTC = new Date(sevenDaysAgo.getTime() + 3 * 60 * 60 * 1000);

        const ordersByDay = await Order.aggregate([
        {
            $match: {
                status: { $in: ['paid', 'shipped', 'delivered'] },
                createdAt: { 
                    $gte: sevenDaysAgoUTC
                }
            }
        },
        {
            $group: {
            _id: {
                $dateToString: { 
                    format: '%Y-%m-%d', 
                    date: '$createdAt', 
                    timezone: '-03:00'
                } 
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
            }
        },
        { $sort: { _id: 1 } }
        ]);

        // 4. Pedidos por Mês (últimos 6 meses)
        const ordersByMonth = await Order.aggregate([
        {
            $match: {
                status: { $in: ['paid', 'shipped', 'delivered'] },
                createdAt: { 
                    $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) 
                }
            }
        },
        {
            $group: {
            _id: { 
                $dateToString: { 
                    format: '%Y-%m', 
                    date: '$createdAt', 
                    timezone: '-03:00'
                } 
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
            }
        },
        { $sort: { _id: 1 } }
        ]);

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
        const newCustomersToday = await User.countDocuments({
        createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
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
        .populate('userId', 'name')
        .lean();

        return {
            status: 200,
            message: "Estatísticas do dashboard recuperadas com sucesso",
            stats: {
                revenue: {
                    today: orderStats[0]?.totalRevenue || 0,
                    total: orderStats[0]?.totalRevenue || 0
                },
                orders: {
                    today: orderStats[0]?.totalOrders || 0,
                    total: orderStats[0]?.totalOrders || 0,
                    byStatus: ordersByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                    }, {})
                },
                customers: {
                    total: customerStats[0]?.totalCustomers || 0,
                    active: customerStats[0]?.activeCustomers || 0,
                    new: newCustomersToday
                },
                products: {
                    total: productStats[0]?.totalProducts || 0,
                    lowStock: productStats[0]?.lowStock || 0,
                    outOfStock: productStats[0]?.outOfStock || 0
                },
                charts: {
                    ordersByDay,
                    ordersByMonth
                },
                topProducts,
                recentOrders
            }
        };
};