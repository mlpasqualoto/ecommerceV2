import {
  createProductService,
  deleteProductImageService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  updateProductStatusService,
  deleteProductService
} from "../services/productService";
import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }
  }
}

// Criar um novo produto (admin)
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0) || (typeof req.files === 'object' && Object.keys(req.files).length === 0)) {
    const error = new Error("Nenhuma imagem enviada.");
    (error as any).statusCode = 400;
    return next(error);
  }
  if (!req.body) {
    const error = new Error("Dados do produto não fornecidos.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const createdProduct = await createProductService(req.body, req.files as Express.Multer.File[]);
    if (!createdProduct) {
      const error = new Error("Erro ao criar produto.");
      (error as any).statusCode = 400;
      return next(error);
    }

    // criar produto
    return res.status(createdProduct.status ?? 200).json({ message: createdProduct.message, product: createdProduct.product ?? null });
  } catch (error) {
    return next(error);
  }
};

// Deletar imagem do produto (admin)
export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.productId || !req.params.publicId) {
    const error = new Error("Id do produto ou publicId não fornecidos.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const updatedProduct = await deleteProductImageService(req.params.productId, req.params.publicId);
    if (!updatedProduct) {
      const error = new Error("Erro ao deletar imagem.");
      (error as any).statusCode = 500;
      return next(error);
    }

    // deletar imagem
    return res.status(updatedProduct.status ?? 200).json({ message: updatedProduct.message, product: updatedProduct.product ?? null });
  } catch (error) {
    return next(error);
  }
};

// Listar produtos com filtros (user e admin)
/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, status
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&status=active
 */
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.query || Object.keys(req.query).length === 0) {
    const error = new Error("Nenhum filtro fornecido.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const productsResult = await getProductsService(req.user, req.query);
    if (!productsResult) {
      const error = new Error("Erro ao listar produtos.");
      (error as any).statusCode = 500;
      return next(error)
    }

    // listar produtos
    return res.status(productsResult.status ?? 200).json({ message: productsResult.message, products: productsResult.products ?? null });
  } catch (error) {
    return next(error);
  }
};

// Obter produto por ID (public)
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.id) {
    const error = new Error("Id do produto não fornecido.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const productResult = await getProductByIdService(req.params.id);
    if (!productResult) {
      const error = new Error("Erro ao obter produto.");
      (error as any).statusCode = 500;
      return next(error);
    }

    // obter por id
    return res.status(productResult.status ?? 200).json({ message: productResult.message, product: productResult.product ?? null });
  } catch (error) {
    return next(error);
  }
};

// Atualizar produto (admin)
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.id) {
    const error = new Error("Id do produto não fornecido.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const updatedProduct = await updateProductService(req.params.id, req.body, req.files as Express.Multer.File[]);
    if (!updatedProduct) {
      const error = new Error("Erro ao atualizar produto.");
      (error as any).statusCode = 400;
      return next(error);
    }  
  
    // atualizar produto
    return res.status(updatedProduct.status ?? 200).json({ message: updatedProduct.message, product: updatedProduct.product ?? null });
  } catch (error) {
    return next(error);
  }
};

// Atualizar status do produto (admin)
export const updateProductStatus = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || !req.body.status) {
    const error = new Error("Status do produto não fornecido.");
    (error as any).statusCode = 400;
    return next(error);
  }
  if (!req.params.id) {
    const error = new Error("Id do produto não fornecido.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const updatedProduct = await updateProductStatusService(req.body.status, req.params.id);
    if (!updatedProduct) {
      const error = new Error("Error ao atualizar status do produto.");
      (error as any).statusCode = 400;
      return next(error);
    }

    // atualizar status
    return res.status(updatedProduct.status ?? 200).json({ message: updatedProduct.message, product: updatedProduct.product ?? null });
  } catch (error) {
    return next(error);
  }
};

// Deletar produto (admin)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.id) {
    const error = new Error("Id do produto não fornecido.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const deleteResult = await deleteProductService(req.params.id);
    if (!deleteResult) {
      const error = new Error("Erro ao deletar produto.");
      (error as any).statusCode = 500;
      return next(error);
    }

    // deletar produto
    return res.status(deleteResult.status ?? 200).json({ message: deleteResult.message });
  } catch (error) {
    return next(error);
  }
};
