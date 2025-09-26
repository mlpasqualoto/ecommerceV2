import express from "express";
import {
  createProduct,
  deleteProductImage,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct
} from "../controllers/productController";
import authenticateToken from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/authRoleMiddleware";
import multer from "multer";

const router: express.Router = express.Router();

const upload: multer.Multer = multer({ storage: multer.memoryStorage() });

// Criar novo produto (admin)
router.post("/create", authenticateToken, authorizeRole("admin"), upload.array("images", 5), createProduct);

// Deletar imagem do produto (admin)
router.delete("/deleteImg/:productId/images/:publicId", authenticateToken, authorizeRole("admin"), deleteProductImage);

// Listar produtos (user e admin)
/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, isActive
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&isActive=true
 */
router.get("/admin", authenticateToken, authorizeRole("admin"), getProducts);

// Rota pública para listar produtos ativos (public)
router.get("/public", getProducts);

// Obter produto por ID (public)
router.get("/:id", getProductById);

// Atualizar produto (admin)
router.put("/:id/update", authenticateToken, authorizeRole("admin"), upload.array("images", 5), updateProduct);

// Atualizar status do produto (admin)
router.patch("/:id/status", authenticateToken, authorizeRole("admin"), updateProductStatus);

// Deletar produto (admin)
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), deleteProduct);

export default router;
