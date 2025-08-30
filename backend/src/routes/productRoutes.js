import express from "express";
import {
  createProduct,
  deleteProductImage,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct
} from "../controllers/productController.js";
import authenticateToken from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/authRoleMiddleware.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Criar novo produto
router.post("/create", authenticateToken, authorizeRole("admin"), upload.array("images", 5), createProduct);

// Deletar imagem do produto
router.delete("/deleteImg/:productId/images/:publicId", authenticateToken, authorizeRole("admin"), deleteProductImage);

/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, isActive
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&isActive=true
 */
router.get("/admin", authenticateToken, authorizeRole("admin"), getProducts);

// Rota pública para listar produtos ativos
router.get("/public", getProducts);

// Obter produto por ID
router.get("/:id", getProductById);

// Atualizar produto
router.put("/:id/update", authenticateToken, authorizeRole("admin"), upload.array("images", 5), updateProduct);

// Atualizar status do produto
router.patch("/:id/status", authenticateToken, authorizeRole("admin"), updateProductStatus);

// Deletar produto
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), deleteProduct);

export default router;
