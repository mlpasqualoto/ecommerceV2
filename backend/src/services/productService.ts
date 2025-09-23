import Product from "../models/Product";
import cloudinary from "../config/cloudinary";
import { ProductServiceResult } from "../controllers/productController";

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

export async function createProductService(productData: any, files: Express.Multer.File[]): Promise<ProductServiceResult> {
    // Normaliza req.files para array
    let filesArray: Express.Multer.File[] = [];
    if (Array.isArray(files)) {
        filesArray = files;
    } else if (files && typeof files === 'object') {
        filesArray = Object.values(files).flat() as Express.Multer.File[];
    }
    if (!filesArray.length) {
        return { status: 400, message: "Nenhuma imagem enviada" };
    }

    const uploads = await Promise.all(
        filesArray.map((f) => uploadToCloudinary(f.buffer))
    );

    productData.images = uploads;
    const savedProduct = await Product.create(productData);

    return { status: 201, message: "Produto criado com sucesso", product: savedProduct };
}

export async function deleteProductImageService(productId: string, publicId: string): Promise<ProductServiceResult> {
    // Verifica se o produto existe
    const product = await Product.findById(productId);
    if (!product) {
        return { status: 404, message: "Produto não encontrado" };
    }

    // Verifica se a imagem existe no produto
    const imageExists = product.images.some(img => img.public_id === publicId);
    if (!imageExists) {
        return { status: 404, message: "Imagem não encontrada" };
    }

    // Remove a imagem do Cloudinary
    await cloudinary.uploader.destroy(publicId);
    const updated = await Product.findByIdAndUpdate(
        productId,
        { $pull: { images: { public_id: publicId } } },
        { new: true }
    );

    return { status: 200, message: "Imagem do produto removida com sucesso", product: updated };
}

export async function getProductsService(user: any, query: any): Promise<ProductServiceResult> {
    if (!user) {
        // Rota pública para listar produtos ativos
        try {
            const data = await Product.find({ status: "active" });
            const products = data.map((item) => ({
                id: item._id,
                name: item.name,
                price: item.price,
                images: item.images,
            }));

            return { status: 200, message: "Produtos encontrados com sucesso", products: products };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { status: 500, message: errorMessage };
        }
    }

    const filter: { [key: string]: any } = {};

    if (query.category) filter.category = query.category;
    if (query.brand) filter.brand = query.brand;
    if (query.status) filter.status = query.status;
    if (query.minPrice || query.maxPrice) {
        filter.price = {};
        if (query.minPrice) filter.price.$gte = Number(query.minPrice);
        if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    const products = await Product.find(filter);
    return { status: 200, message: "Produtos encontrados com sucesso", products: products };
}
