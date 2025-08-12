import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct
} from "../controllers/productController.js";
import authenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Criar novo produto
router.post("/", createProduct); // colocar a autenticação aqui

/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, isActive
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&isActive=true
 */
router.get("/", getProducts);

// Obter produto por ID
router.get("/:id", getProductById);

// Atualizar produto
router.put("/:id", updateProduct); // colocar a autenticação aqui

// Atualizar status do produto
router.patch("/:id/status", updateProductStatus); // colocar a autenticação aqui

// Deletar produto
router.delete("/:id/delete", deleteProduct); // colocar a autenticação aqui

export default router;
