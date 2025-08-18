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
import { authorizeRole } from "../middlewares/authRoleMiddleware.js";

const router = express.Router();

// Criar novo produto
router.post("/create", authenticateToken, authorizeRole("admin"), createProduct);

/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, isActive
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&isActive=true
 */
router.get("/", getProducts);

// Obter produto por ID
router.get("/:id", getProductById);

// Atualizar produto
router.put("/:id/update", authenticateToken, authorizeRole("admin"), updateProduct);

// Atualizar status do produto
router.patch("/:id/status", authenticateToken, authorizeRole("admin"), updateProductStatus);

// Deletar produto
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), deleteProduct);

export default router;
