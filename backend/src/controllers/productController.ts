import {
  createProductService,
  deleteProductImageService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  updateProductStatusService,
  deleteProductService
} from "../services/productService";
import { Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }
  }
}

export interface ProductServiceResult {
  status: number;
  message: string;
  product?: any;
  products?: any[];
}

// Criar um novo produto (admin)
export const createProduct = async (req: Request, res: Response) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0) || (typeof req.files === 'object' && Object.keys(req.files).length === 0)) {
    return res.status(400).json({ message: "Nenhuma imagem enviada" });
  }
  if (!req.body) {
    return res.status(400).json({ message: "Dados do produto não fornecidos" });
  }
  try {
    const createdProduct = await createProductService(req.body, req.files as Express.Multer.File[]);
    res.status(createdProduct.status).json({ message: createdProduct.message, product: createdProduct.product ? createdProduct.product : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: "Erro ao criar produto", error: errorMessage });
  }
};

// Deletar imagem do produto
export const deleteProductImage = async (req: Request, res: Response) => {
  if (!req.params || !req.params.productId || !req.params.publicId) {
    return res.status(400).json({ message: "ID do produto ou publicId não fornecidos" });
  }
  try {
    const updatedProduct = await deleteProductImageService(req.params.productId, req.params.publicId);
    res.status(updatedProduct.status).json({ message: updatedProduct.message, product: updatedProduct.product ? updatedProduct.product : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao remover imagem", error: errorMessage });
  }
};

/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, status
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&status=active
 */
export const getProducts = async (req: Request, res: Response) => {
  if (!req.query || Object.keys(req.query).length === 0) {
    return res.status(400).json({ message: "Nenhum filtro fornecido" });
  }
  try {
    const productsResult = await getProductsService(req.user, req.query);
    res.status(productsResult.status).json({ message: productsResult.message, products: productsResult.products ? productsResult.products : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao listar produtos", error: errorMessage });
  }
};

// Obter produto por ID
export const getProductById = async (req: Request, res: Response) => {
  if (!req.params || !req.params.id) {
    return res.status(400).json({ message: "ID do produto não fornecido" });
  }
  try {
    const productResult = await getProductByIdService(req.params.id);
    res.status(productResult.status).json({ message: productResult.message, product: productResult.product ? productResult.product : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao obter produto", error: errorMessage });
  }
};

// Atualizar produto
export const updateProduct = async (req: Request, res: Response) => {
  if (!req.params || !req.params.id) {
    return res.status(400).json({ message: "ID do produto não fornecido" });
  }
  try {
    const updatedProduct = await updateProductService(req.params.id, req.body, req.files as Express.Multer.File[]);
    res.status(updatedProduct.status).json({ message: updatedProduct.message, product: updatedProduct.product ? updatedProduct.product : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: "Erro ao atualizar produto", error: errorMessage });
  }
};

// Atualizar status do produto
export const updateProductStatus = async (req: Request, res: Response) => {
  if (!req.body || !req.body.status) {
    return res.status(400).json({ message: "Status do produto não fornecido" });
  }
  if (!req.params || !req.params.id) {
    return res.status(400).json({ message: "ID do produto não fornecido" });
  }
  try {
    const updatedProduct = await updateProductStatusService(req.body.status, req.params.id);
    res.status(updatedProduct.status).json({ message: updatedProduct.message, product: updatedProduct.product ? updatedProduct.product : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: "Erro ao atualizar status do produto", error: errorMessage });
  }
};

// Deletar produto
export const deleteProduct = async (req: Request, res: Response) => {
  if (!req.params || !req.params.id) {
    return res.status(400).json({ message: "ID do produto não fornecido" });
  }
  try {
    const deleteResult = await deleteProductService(req.params.id);
    res.status(deleteResult.status).json({ message: deleteResult.message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao remover produto", error: errorMessage });
  }
};
