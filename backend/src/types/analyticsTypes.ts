import { Document } from "mongoose";

export interface DashboardStats {
        revenue: {
            today: number;
            total: number;
        };
        orders: {
            today: number;
            total: number;
            byStatus: Record<string, number>;
        };
        customers: {
            total: number;
            active: number;
            new: number;
        };
        products: {
            total: number;
            lowStock: number;
            outOfStock: number;
        };
        charts: {
            ordersByDay: Array<{ _id: string; orders: number; revenue: number }>;
            ordersByMonth: Array<{ _id: string; orders: number; revenue: number }>;
        };
        topProducts: Array<{
            _id: string;
            name: string;
            totalSales: number;
            totalRevenue: number;
        }>;
        recentOrders: Array<Document>;
}

export interface AnalyticsServiceResult {
    status: number;
    message: string;
    stats?: DashboardStats;
}
