import Product from "../models/Product.js";

// Criar novo produto
export const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();

        res.status(201).json({ message: "Produto criado com sucesso", product: savedProduct });
    } catch (err) {
        res.status(400).json({ message: "Erro ao criar produto", error: err.message });
    }
};

/**
 * Listar produtos com filtros
 * Filtros disponíveis: category, brand, minPrice, maxPrice, isActive
 * Exemplo: /products?category=Eletrônicos&minPrice=100&maxPrice=500&isActive=true
 */
export const getProducts = async (req, res) => {
    try {
        const { category, brand, minPrice, maxPrice, isActive } = req.query;

        const filter = {};

        if (category) filter.category = category;
        if (brand) filter.brand = brand;
        if (isActive !== undefined) filter.isActive = isActive === "true";
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(filter);
        res.json({ message: "Produtos encontrados com sucesso", products: products });
    } catch (err) {
        res.status(500).json({ message: "Erro ao listar produtos", error: err.message });
    }
};

// Obter produto por ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        res.json({ message: "Produto encontrado com sucesso", product: product });
    } catch (err) {
        res.status(500).json({ message: "Erro ao obter produto", error: err.message });
    }
};

// Atualizar produto
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        res.json({ message: "Produto atualizado com sucesso", product: product });
    } catch (err) {
        res.status(400).json({ message: "Erro ao atualizar produto", error: err.message });
    }
};

// Atualizar status do produto
export const updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ["active", "inactive", "out_of_stock", "archived", "draft"];
        if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Status inválido" });

        const product = await Product.findByIdAndUpdate(req.params.id, { status: status }, { new: true });
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        res.json({ message: "Status do produto atualizado com sucesso", product: product });
    } catch (err) {
        res.status(400).json({ message: "Erro ao atualizar status do produto", error: err.message });
    }
};

// Deletar produto
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        res.json({ message: "Produto removido com sucesso" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao remover produto", error: err.message });
    }
};
