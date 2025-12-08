import express from "express";
import { 
  comparePeriods,
  dashBoardsStats, 
  exportMonthlyReport, 
  exportWeeklyReport, 
  getMonthlyReport, 
  getSummary, 
  getWeeklyReport 
} from "../controllers/analyticsController";
import authenticateToken from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/authRoleMiddleware"
import {
  adminQueryLimiter,
  sensitiveActionLimiter,
  publicActionLimiter,
} from "../middlewares/rateLimitMiddleware"

const router: express.Router = express.Router();

// **** ANALÍTICOS DO DASHBOARD **** //

// Rota para obter estatísticas do dashboard (admin)
router.get("/dashboard", authenticateToken, authorizeRole("admin"), adminQueryLimiter, dashBoardsStats);

// **** RELATÓRIOS ANALÍTICOS **** //

// Rota para obter relatório semanal
//Exemplo: /api/reports/weekly/2024-W50
router.get('/weekly/:weekYear', authenticateToken, authorizeRole("admin"), adminQueryLimiter, getWeeklyReport);

// Rota para obter relatório mensal
//Exemplo: /api/reports/monthly/2024-12
router.get('/monthly/:monthYear', authenticateToken, authorizeRole("admin"), adminQueryLimiter, getMonthlyReport);

// Rota para comparar dois períodos
//Exemplo: /api/reports/compare?period1Start=2024-12-01&period1End=2024-12-07&period2Start=2024-11-24&period2End=2024-11-30
router.get('/compare', authenticateToken, authorizeRole("admin"), adminQueryLimiter, comparePeriods);

// Rota para exportar relatório semanal em CSV
router.get('/weekly/:weekYear/export', authenticateToken, authorizeRole("admin"), adminQueryLimiter, exportWeeklyReport);

// Rota para exportar relatório mensal em CSV
router.get('/monthly/:monthYear/export', authenticateToken, authorizeRole("admin"), adminQueryLimiter, exportMonthlyReport);

// Rota para retornar resumo rápido dos principais indicadores
router.get('/summary', authenticateToken, authorizeRole("admin"), adminQueryLimiter, getSummary);

export default router;
