import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Obter todos os produtos (público)
router.get("/", (req, res) => {
  res.json(products);
});

// Criar um novo produto
router.post("/", authenticateToken, (req, res) => {
  const { nome, preço, description, category } = req.body;
  const newProduct = { id: Date.now(), nome, preço, description, category };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Rota para obter detalhes de um produto específico
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const produto = products.find((p) => p.id === id);

  if (!produto) {
    return res.status(404).json({ erro: "Produto não encontrado" });
  }

  res.json(produto);
});

// Atualiza um produto existente
router.put("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { nome, preco } = req.body;
  res.json({
    message: `Produto ${id} atualizado com sucesso!`,
    produto: { id, nome, preco },
    user: req.user,
  });
});

// Remove um produto
router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  res.json({ message: `Produto ${id} removido com sucesso!`, user: req.user });
});

export default router;
