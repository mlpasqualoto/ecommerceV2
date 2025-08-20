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
  deleteOrder
} from "../controllers/orderController.js";
import authenticateToken from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/authRoleMiddleware.js"

const router = express.Router();

// Criar um novo pedido
router.post("/create", authenticateToken, createOrder);

// Listar todos os pedidos do usuário
router.get("/", authenticateToken, getOrders);

// Obter um pedido por ID
router.get("/:id", authenticateToken, getOrderById);

// Obter pedidos pelo status (user)
router.get("/:status/get-by-status", authenticateToken, getOrdersByStatus);

// Obter pedidos pelo status (somente admin - todos os pedidos)
router.get("/:status/get-all-by-status", authenticateToken, authorizeRole("admin"), getAllOrdersByStatus);

// Obter pedidos por data (user)
router.get("/:date/get-by-date", authenticateToken, getOrdersByDate);

// Obter pedidos por data (somente admin - todos os pedidos)
router.get("/:date/get-all-by-date", authenticateToken, authorizeRole("admin"), getAllOrdersByDate);

// Atualizar um pedido
router.put("/:id/update", authenticateToken, authorizeRole("admin"), updateOrder);

// Pagar um pedido
router.patch("/:id/pay", authenticateToken, authorizeRole("admin"), payOrder);

// Enviar um pedido
router.patch("/:id/ship", authenticateToken, authorizeRole("admin"), shipOrder);

// Cancelar um pedido
router.patch("/:id/cancel", authenticateToken, cancelOrder);

// Deletar um pedido
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), deleteOrder);

export default router;
