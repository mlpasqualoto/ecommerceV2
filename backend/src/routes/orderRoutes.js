import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder
} from "../controllers/orderController.js";
import authenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Criar um novo pedido
router.post("/", createOrder); // colocar a autenticação aqui

// Listar todos os pedidos
router.get("/", getOrders); // colocar a autenticação aqui

// Obter um pedido por ID
router.get("/:id", authenticateToken, getOrderById);

// Atualizar um pedido
router.put("/:id", authenticateToken, updateOrder);

// Deletar um pedido
router.delete("/:id", authenticateToken, deleteOrder);

export default router;
