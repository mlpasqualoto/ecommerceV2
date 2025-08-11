import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Obter todos os pedidos
router.get("/", authenticateToken, (req, res) => {
  res.json(orders);
});

// Criar um novo pedido
router.post("/", authenticateToken, (req, res) => {
  const { items, total } = req.body;
  const newOrder = {
    id: Date.now(),
    userId: req.user.id,
    items,
    total,
    status: "pending",
    createdAt: new Date(),
  };

  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// Obter detalhes de um pedido específico
router.get("/:id", authenticateToken, (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ message: "Pedido não encontrado" });
  }

  if (order.userId !== req.user.id) {
    return res.status(403).json({ message: "Acesso negado" });
  }

  res.json(order);
});

// Atualizar um pedido existente
router.put("/:id", authenticateToken, (req, res) => {
  const orderIndex = orders.findIndex((o) => o.id === Number(req.params.id));
  if (orderIndex === -1) {
    return res.status(404).json({ message: "Pedido não encontrado" });
  }

  if (orders[orderIndex].userId !== req.user.id) {
    return res.status(403).json({ message: "Acesso negado" });
  }

  const { items, total, status } = req.body;
  orders[orderIndex] = {
    ...orders[orderIndex],
    items: items || orders[orderIndex].items,
    total: total || orders[orderIndex].total,
    status: status || orders[orderIndex].status,
    updatedAt: new Date(),
  };

  res.json(orders[orderIndex]);
});

// Excluir um pedido
router.delete("/:id", authenticateToken, (req, res) => {
  const orderIndex = orders.findIndex((o) => o.id === Number(req.params.id));
  if (orderIndex === -1) {
    return res.status(404).json({ message: "Pedido não encontrado" });
  }

  if (orders[orderIndex].userId !== req.user.id) {
    return res.status(403).json({ message: "Acesso negado" });
  }

  orders.splice(orderIndex, 1);
  res.json({ message: "Pedido excluído com sucesso" });
});

export default router;
