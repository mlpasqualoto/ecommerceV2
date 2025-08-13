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
router.post("/", createOrder); // colocar a autenticação aqui

// Listar todos os pedidos do usuário
router.get("/", getOrders); // colocar a autenticação aqui

// Obter um pedido por ID
router.get("/:id", getOrderById); // colocar a autenticação aqui

// Obter pedidos pelo status
router.get("/:status/getByStatus", getOrdersByStatus); // colocar a autenticação aqui

// Atualizar um pedido
router.put("/:id", updateOrder); // colocar a autenticação aqui

// Pagar um pedido
router.patch("/:id/pay", payOrder); // colocar a autenticação aqui

// Cancelar um pedido
router.patch("/:id/cancel", cancelOrder); // colocar a autenticação aqui

// Deletar um pedido
router.delete("/:id/delete", deleteOrder); // colocar a autenticação aqui

export default router;
