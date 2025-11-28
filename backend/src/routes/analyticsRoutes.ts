import express from "express";
import { dashBoardsStats } from "../controllers/analyticsController";
import authenticateToken from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/authRoleMiddleware"
import {
  adminQueryLimiter,
  sensitiveActionLimiter,
  publicActionLimiter,
} from "../middlewares/rateLimitMiddleware"

const router: express.Router = express.Router();

// Rota para obter estatísticas do dashboard (admin)
router.get("/dashboard", authenticateToken, authorizeRole("admin"), adminQueryLimiter, dashBoardsStats);

export default router;
