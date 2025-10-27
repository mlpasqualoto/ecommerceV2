import express from "express";
import {
  createProduct,
  deleteProductImage,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct,
} from "../controllers/productController";
import authenticateToken from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/authRoleMiddleware";
import multer from "multer";
import {
  adminQueryLimiter,
  sensitiveActionLimiter,
  publicActionLimiter,
} from "../middlewares/rateLimitMiddleware"

const router: express.Router = express.Router();

const upload: multer.Multer = multer({ storage: multer.memoryStorage() });

// Criar novo produto (admin)
router.post("/create", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, upload.array("images", 5), createProduct);

// Deletar imagem do produto (admin)
router.delete("/deleteImg/:productId/images/:publicId", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, deleteProductImage);

// Listar produtos (user e admin)
/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, isActive
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&isActive=true
 */
router.get("/admin", authenticateToken, authorizeRole("admin"), adminQueryLimiter, getProducts);

// Rota pública para listar produtos ativos (public)
router.get("/public", adminQueryLimiter, getProducts);

// Obter produto por ID (public)
router.get("/:id", adminQueryLimiter, getProductById);

// Atualizar produto (admin)
router.put("/:id/update", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, upload.array("images", 5), updateProduct);

// Atualizar status do produto (admin)
router.patch("/:id/status", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, updateProductStatus);

// Deletar produto (admin)
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), publicActionLimiter, deleteProduct);

export default router;
