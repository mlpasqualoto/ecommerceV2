import { 
    comparePeriodsService,
    getDashBoardsStatsService,
    getMonthlyReportService,
    getWeeklyReportService,
    exportWeeklyReportService,
    exportMonthlyReportService,
    exportDailyReportService
 } from "../services/analyticsService";
import { NextFunction, Request, Response } from "express";

// **** ESTATÍSTICAS DO DASHBOARD **** //

// Rota para obter estatísticas do dashboard (admin)
export const dashBoardsStats = async (req: Request, res: Response, next: NextFunction) => {
    const {startDate, endDate} = req.query;

    if (!startDate || !endDate) {
        const error = new Error("Parâmetros startDate e endDate não informados.");
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

        return res.status(stats.status ?? 200).json({ message: stats.message, stats: stats.stats ?? null });
    } catch (error) {
        return next(error);
    }
};

// **** RELATÓRIOS DE VENDAS **** //

// Rota para obter relatório semanal (admin)
export const getWeeklyReport = async (req: Request, res: Response, next: NextFunction) => {
    const { weekYear } = req.params;

    if (!weekYear) {
        const error = new Error("Parâmetro weekYear não informado.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {     
        // Valida formato
        if (!weekYear.match(/^\d{4}-W\d{1,2}$/)) {
        return res.status(400).json({
            status: 400,
            message: 'Formato inválido. Use YYYY-WNN (ex: 2024-W50)'
        });
        }

        const result = await getWeeklyReportService(weekYear);
        if (!result) {
            const error = new Error("Erro ao gerar relatório semanal.");
            (error as any).statusCode = 500;
            return next(error);
        }
        
        return res.status(result.status ?? 200).json(result);
    } catch (error) {
        return next(error);
    }
};

// Rota para obter relatório mensal (admin)
export const getMonthlyReport = async (req: Request, res: Response, next: NextFunction) => {
    const { monthYear } = req.params;
    
    if (!monthYear) {
        const error = new Error("Parâmetro monthYear não informado.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {     
        // Valida formato
        if (!monthYear.match(/^\d{4}-\d{2}$/)) {
        return res.status(400).json({
            status: 400,
            message: 'Formato inválido. Use YYYY-MM (ex: 2024-12)'
        });
        }

        const result = await getMonthlyReportService(monthYear);
        if (!result) {
            const error = new Error("Erro ao gerar relatório mensal.");
            (error as any).statusCode = 500;
            return next(error);
        }
        
        return res.status(result.status ?? 200).json(result);
    } catch (error) {
        return next(error);
    }
};

// Rota para comparar dois períodos (admin)
export const comparePeriods = async (req: Request, res: Response, next: NextFunction) => {
    const { period1Start, period1End, period2Start, period2End } = req.query;

    if (!period1Start || !period1End || !period2Start || !period2End) {
        const error = new Error("Parâmetros obrigatórios: period1Start, period1End, period2Start, period2End.");
        (error as any).statusCode = 400;
        return next(error);
    }
    
    try {
        const result = await comparePeriodsService(
            period1Start as string,
            period1End as string,
            period2Start as string,
            period2End as string
        );
        if (!result) {
            const error = new Error("Erro ao comparar períodos.");
            (error as any).statusCode = 500;
            return next(error);
        }
        
        return res.status(result.status ?? 200).json(result);
    } catch (error) {
        return next(error);
    }
};

// Rota para exportar relatório diário em CSV (admin)
export const exportDailyReport = async (req: Request, res: Response, next: NextFunction) => {
    const { date } = req.params;

    if (!date) {
        const error = new Error("Parâmetro date não informado.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const csv = await exportDailyReportService(date);

        if (!csv) {
            return res.status(404).json({ 
                message: "Nenhum dado encontrado para este período ou formato inválido." 
            });
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-diario-${date}.csv`);

        return res.send(csv);
    } catch (error) {
        return next(error);
    }
};


// Rota para exportar relatório semanal em CSV (admin)
export const exportWeeklyReport = async (req: Request, res: Response, next: NextFunction) => {
    const { weekYear } = req.params;

    if (!weekYear) {
        const error = new Error("Parâmetro weekYear não informado.");
        (error as any).statusCode = 400;
        return next(error);
    } 
    try {    
        const csv = await exportWeeklyReportService(weekYear);
        
        if (!csv) {
            // Se retornou null ou string vazia, pode ser que não haja dados ou formato inválido
            return res.status(404).json({ 
                message: "Nenhum dado encontrado para este período ou formato inválido." 
            });
        }
        
        // Adicionado charset=utf-8 para garantir que o BOM funcione
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-semanal-${weekYear}.csv`);
        
        return res.send(csv);
    } catch (error) {
        return next(error);
    }
};

// Rota para exportar relatório mensal em CSV (admin)
export const exportMonthlyReport = async (req: Request, res: Response, next: NextFunction) => {
    const { monthYear } = req.params;
    
    if (!monthYear) {
        const error = new Error("Parâmetro monthYear não informado.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        // ✅ Alterado para usar o novo serviço detalhado
        const csv = await exportMonthlyReportService(monthYear);

        if (!csv) {
            return res.status(404).json({ 
                message: "Nenhum dado encontrado para este período ou formato inválido." 
            });
        }
        
        // Adicionado charset=utf-8 para garantir que o BOM funcione
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-mensal-${monthYear}.csv`);
        
        return res.send(csv);
    } catch (error) {
        return next(error);
    }
};

// Rota para retornar resumo rápido dos principais indicadores
export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Período padrão: últimos 30 dias
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const monthYear = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
        const result = await getMonthlyReportService(monthYear);
        if (!result || !result.report) {
            const error = new Error("Erro ao gerar relatório mensal.");
            (error as any).statusCode = 500;
            throw error;
        }

        return res.status(200).json({
          message: 'Resumo recuperado com sucesso',
          summary: result.report.summary
        });
    } catch (error) {
        return next(error);
    }
};
