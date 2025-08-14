import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByStatus,
  getAllOrdersByStatus,
  updateOrder,
  payOrder,
  cancelOrder,
  deleteOrder
} from "../controllers/orderController.js";
import authenticateToken from "../middlewares/authMiddleware.js";
import authorizeRole from "../middlewares/authRoleMiddleware.js"

const router = express.Router();

// Criar um novo pedido
router.post("/create", authenticateToken, createOrder);

// Listar todos os pedidos do usuário
router.get("/", authenticateToken, getOrders);

// Obter um pedido por ID
router.get("/:id", authenticateToken, getOrderById);

// Obter pedidos pelo status (user)
router.get("/:status/getByStatus", authenticateToken, getOrdersByStatus);

// Obter pedidos pelo status (somente admin - todos os pedidos)
router.get("/:status/getAllByStatus", authenticateToken, authorizeRole("admin"), getAllOrdersByStatus);

// Atualizar um pedido
router.put("/:id/update", authenticateToken, authorizeRole("admin"), updateOrder);

// Pagar um pedido
router.patch("/:id/pay", authenticateToken, authorizeRole("admin"), payOrder);

// Cancelar um pedido
router.patch("/:id/cancel", authenticateToken, cancelOrder);

// Deletar um pedido
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), deleteOrder);

export default router;
