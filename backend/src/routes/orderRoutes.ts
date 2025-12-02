import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByStatus,
  getAllOrdersByStatus,
  getOrdersByDate,
  getAllOrdersByDate,
  updateOrder,
  payOrder,
  shipOrder,
  cancelOrder,
  deleteOrder,
  olistSyncHandler,
} from "../controllers/orderController";
import authenticateToken from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/authRoleMiddleware"
import {
  adminQueryLimiter,
  sensitiveActionLimiter,
  publicActionLimiter,
} from "../middlewares/rateLimitMiddleware"

const router: express.Router = express.Router();

// Criar um novo pedido (user)
router.post("/create", authenticateToken, sensitiveActionLimiter, createOrder);

// Listar todos os pedidos do usuário (user)
router.get("/", authenticateToken, getOrders);

// Obter um pedido por ID (user)
router.get("/:id", authenticateToken, adminQueryLimiter, getOrderById);

// Obter pedidos pelo status (user)
router.get("/:status/get-by-status", authenticateToken, adminQueryLimiter, getOrdersByStatus);

// Obter pedidos pelo status (admin - todos os pedidos)
router.get("/:status/get-all-by-status", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, getAllOrdersByStatus);

// Obter pedidos por data (user)
router.get("/:date/get-by-date", authenticateToken, getOrdersByDate);

// Obter pedidos por data (admin - todos os pedidos)
router.get("/:date/get-all-by-date", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, getAllOrdersByDate);

// Atualizar um pedido (admin)
router.put("/:id/update", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, updateOrder);

// Pagar um pedido (admin)
router.patch("/:id/pay", authenticateToken, authorizeRole("admin"), publicActionLimiter, payOrder);

// Enviar um pedido (admin)
router.patch("/:id/ship", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, shipOrder);

// Cancelar um pedido (user)
router.patch("/:id/cancel", authenticateToken, sensitiveActionLimiter, cancelOrder);

// Deletar um pedido (admin)
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), publicActionLimiter, deleteOrder);

// **** SINCRONIZAÇÃO OLIST **** //
// Sincronizar pedidos da Olist (admin)
router.get("/olistSync/:dataInicial/:dataFinal", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, olistSyncHandler);

export default router;
