import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByStatus,
  updateOrder,
  payOrder,
  cancelOrder,
  deleteOrder
} from "../controllers/orderController.js";
import authenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Criar um novo pedido
router.post("/", authenticateToken, createOrder); // colocar a autenticação aqui

// Listar todos os pedidos do usuário
router.get("/", authenticateToken, getOrders); // colocar a autenticação aqui

// Obter um pedido por ID
router.get("/:id", authenticateToken, getOrderById); // colocar a autenticação aqui

// Obter pedidos pelo status
router.get("/:status/getByStatus", authenticateToken, getOrdersByStatus); // colocar a autenticação aqui

// Atualizar um pedido
router.put("/:id", authenticateToken, updateOrder); // colocar a autenticação aqui

// Pagar um pedido
router.patch("/:id/pay", authenticateToken, payOrder); // colocar a autenticação aqui

// Cancelar um pedido
router.patch("/:id/cancel", authenticateToken, cancelOrder); // colocar a autenticação aqui

// Deletar um pedido
router.delete("/:id/delete", authenticateToken, deleteOrder); // colocar a autenticação aqui

export default router;
