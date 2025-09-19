import Product from "../models/Product";
import cloudinary from "../config/cloudinary";
import { Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }
  }
}

const uploadToCloudinary = (fileBuffer: Buffer, folder = "ecommerce/products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Ex.: gerar derivado de forma síncrona (opcional)
        // eager: [{ width: 800, height: 800, crop: "fill", gravity: "auto" }],
      },
      (err, result: any) => {
        if (err) return reject(err);
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

// Criar novo produto
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Normaliza req.files para array
    let filesArray: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      filesArray = req.files;
    } else if (req.files && typeof req.files === 'object') {
      filesArray = Object.values(req.files).flat();
    }
    if (!filesArray.length) {
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }

    const product = req.body;

    const uploads = await Promise.all(
      filesArray.map((f) => uploadToCloudinary(f.buffer))
    );

    product.images = uploads;
    const savedProduct = await Product.create(product);

    res.status(201).json({ message: "Produto criado com sucesso", product: savedProduct });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: "Erro ao criar produto", error: errorMessage });
  }
};

// Deletar imagem do produto
export const deleteProductImage = async (req: Request, res: Response) => {
  try {
    if (!req.params || !req.params.productId || !req.params.publicId) {
      return res.status(400).json({ message: "ID do produto ou publicId não fornecidos" });
    }
    const { productId, publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);
    const updated = await Product.findByIdAndUpdate(
      productId,
      { $pull: { images: { public_id: publicId } } },
      { new: true }
    );
    res.json({ message: "Imagem do produto removida com sucesso", product: updated });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    res.status(500).json({ message: "Erro ao remover imagem", error: errorMessage });
  }
};

/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, status
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&status=active
 */
export const getProducts = async (req: Request, res: Response) => {
  if (!req.user) {
    // Rota pública para listar produtos ativos
    try {
      const data = await Product.find({ status: "active" });
      const products = data.map((item) => ({
        id: item._id,
        name: item.name,
        price: item.price,
        images: item.images,
      }));

      return res.json({ message: "Produtos encontrados com sucesso", products: products });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ message: "Erro ao listar produtos", error: errorMessage });
    }
  }

  try {
    if (!req.query || Object.keys(req.query).length === 0) {
      return res.status(400).json({ message: "Nenhum filtro fornecido" });
    }
    const { category, brand, minPrice, maxPrice, status } = req.query;

    const filter: { [key: string]: any } = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter);
    res.json({
      message: "Produtos encontrados com sucesso",
      products: products,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao listar produtos", error: errorMessage });
  }
};

// Obter produto por ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    if (!req.params || !req.params.id) {
      return res.status(400).json({ message: "ID do produto não fornecido" });
    }
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Produto não encontrado" });

    res.json({ message: "Produto encontrado com sucesso", product: product });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao obter produto", error: errorMessage });
  }
};

// Atualizar produto
export const updateProduct = async (req: Request, res: Response) => {
  try {
    if (!req.params || !req.params.id) {
      return res.status(400).json({ message: "ID do produto não fornecido" });
    }
    const { id } = req.params;

    // Pega os campos do body
    const {
      name,
      price,
      description,
      category,
      stock,
      status,
      discount,
      existingImages,
    } = req.body;

    // Começa com as imagens existentes
    let finalImages = [];
    if (existingImages) {
      // pode vir como JSON string ou como múltiplos campos
      try {
        finalImages = JSON.parse(existingImages);
      } catch {
        if (Array.isArray(existingImages)) {
          finalImages = existingImages;
        } else {
          finalImages = [existingImages];
        }
      }
    }

    // Se houver novos arquivos, faz upload para o Cloudinary
    let filesArray: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      filesArray = req.files;
    } else if (req.files && typeof req.files === 'object') {
      filesArray = Object.values(req.files).flat();
    }
    if (filesArray.length > 0) {
      const uploads = await Promise.all(
        filesArray.map((f) => uploadToCloudinary(f.buffer))
      );
      finalImages = [...finalImages, ...uploads];
    }

    // Monta os campos atualizados
    const updateData = {
      name,
      price,
      description,
      category,
      stock,
      status,
      discount,
      images: finalImages,
    };

    // Atualiza no banco
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    res.json({ message: "Produto atualizado com sucesso", product: updatedProduct });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: "Erro ao atualizar produto", error: errorMessage });
  }
};

// Atualizar status do produto
export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    if (!req.body || !req.body.status) {
      return res.status(400).json({ message: "Status do produto não fornecido" });
    }
    const { status } = req.body;
    const allowedStatuses = [
      "active",
      "inactive",
      "out_of_stock",
      "archived",
      "draft",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    if (!req.params || !req.params.id) {
      return res.status(400).json({ message: "ID do produto não fornecido" });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );

    if (!product)
      return res.status(404).json({ message: "Produto não encontrado" });

    res.json({ message: "Status do produto atualizado com sucesso", product: product });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: "Erro ao atualizar status do produto", error: errorMessage });
  }
};

// Deletar produto
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    if (!req.params || !req.params.id) {
      return res.status(400).json({ message: "ID do produto não fornecido" });
    }
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Produto não encontrado" });

    res.json({ message: "Produto removido com sucesso" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao remover produto", error: errorMessage });
  }
};
