import { getDashBoardsStatsService } from "../services/analyticsService";
import { NextFunction, Request, Response } from "express";

export const dashBoardsStats = async (req: Request, res: Response, next: NextFunction) => {
    const {startDate, endDate} = req.query;

    if (!startDate || !endDate) {
        const error = new Error("Start date and end date are required.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const stats = await getDashBoardsStatsService(startDate as string, endDate as string);
        if (!stats) {
            const error = new Error("Erro ao buscar estatísticas do dashboard.");
            (error as any).statusCode = 500;
            return next(error);
        }

        res.status(stats.status ?? 200).json({ message: stats.message, stats: stats.stats ?? null });
    } catch (error) {
        return next(error);
    }
};