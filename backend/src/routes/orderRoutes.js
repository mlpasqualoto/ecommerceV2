import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Lista de todos os pedidos");
});

router.post("/", (req, res) => {
  res.send("Criar um novo pedido");
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Detalhes do pedido com ID: ${id}`);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Pedido com ID ${id} atualizado`);
});

// Atualizar parcialmente um pedido existente (ex: status)
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Pedido com ID ${id} atualizado parcialmente`);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Pedido com ID ${id} removido`);
});

export default router;
