import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Lista de todos os produtos");
});

router.post("/", (req, res) => {
  res.send("Criar um novo produto");
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Detalhes do produto com ID: ${id}`);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Produto com ID ${id} atualizado`);
});

// Atualizar parcialmente um produto existente (ex: preço)
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Produto com ID ${id} atualizado parcialmente`);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Produto com ID ${id} removido`);
});

export default router;
