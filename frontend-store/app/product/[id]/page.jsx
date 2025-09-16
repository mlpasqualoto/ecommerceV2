"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cldUrl } from "@/lib/cld.js";
import { fetchProductById, fetchProducts } from "@/lib/api.js";
import {
    Star,
    Heart,
    ShoppingBag,
    Truck,
    Shield,
    RotateCcw,
    Minus,
    Plus,
    Share2,
    ChevronLeft,
    ChevronRight,
    Check,
    CreditCard
} from "lucide-react";
import { formatCurrencyBRL } from "@/utils/utils.js";

export default function ProductPage({ params }) {
    const { id } = params;
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    // Mock data para demonstração - substitua pela sua API
    const mockProduct = {
        id: 1,
        name: "Smartphone Premium XYZ Pro",
        description: "Um smartphone revolucionário com tecnologia de ponta, design elegante e performance excepcional. Equipado com processador octa-core, câmera tripla de 108MP e bateria de longa duração.",
        price: 2499.90,
        originalPrice: 2999.90,
        discount: 17,
        rating: 4.8,
        reviewCount: 234,
        stock: 15,
        category: "Eletrônicos",
        brand: "TechBrand",
        sku: "XYZ-PRO-001",
        images: [
            "/api/placeholder/800/800",
            "/api/placeholder/800/800",
            "/api/placeholder/800/800",
            "/api/placeholder/800/800"
        ],
        sizes: ["64GB", "128GB", "256GB"],
        colors: ["Preto", "Branco", "Azul", "Rosa"],
        features: [
            "Processador Octa-core 3.2GHz",
            "8GB RAM + 128GB Storage",
            "Câmera Tripla 108MP + 12MP + 5MP",
            "Tela AMOLED 6.7\" 120Hz",
            "Bateria 5000mAh com carregamento rápido",
            "Resistente à água IP68",
            "5G Ready",
            "Sistema de segurança biométrica"
        ],
        specifications: {
            "Tela": "6.7\" AMOLED, 2400x1080, 120Hz",
            "Processador": "Snapdragon 888, Octa-core 3.2GHz",
            "Memória": "8GB RAM, 128GB Storage",
            "Câmera": "Tripla: 108MP + 12MP + 5MP",
            "Bateria": "5000mAh, Carregamento rápido 65W",
            "Sistema": "Android 13",
            "Conectividade": "5G, WiFi 6, Bluetooth 5.2",
            "Dimensões": "163.3 x 75.9 x 8.9mm",
            "Peso": "192g"
        }
    };

    useEffect(() => {
        const loadProduct = async () => {
            try {
                // Simular carregamento
                await new Promise(resolve => setTimeout(resolve, 1000));
                setProduct(mockProduct);

                // Carregar produtos relacionados
                const relatedData = Array.from({ length: 4 }, (_, i) => ({
                    id: i + 2,
                    name: `Produto Relacionado ${i + 1}`,
                    price: 299.90 + (i * 100),
                    image: "/api/placeholder/300/300",
                    rating: 4.5 + (i * 0.1)
                }));
                setRelatedProducts(relatedData);
            } catch (error) {
                console.error("Erro ao carregar produto:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id]);

    const handleQuantityChange = (action) => {
        if (action === 'increase') {
            setQuantity(prev => Math.min(prev + 1, product?.stock || 10));
        } else {
            setQuantity(prev => Math.max(prev - 1, 1));
        }
    };

    const handleAddToCart = () => {
        // Implementar lógica de adicionar ao carrinho
        console.log("Adicionado ao carrinho:", {
            product: product?.name,
            quantity,
            size: selectedSize,
            color: selectedColor
        });
    };

    const handleBuyNow = () => {
        // Implementar lógica de compra direta
        console.log("Compra direta:", {
            product: product?.name,
            quantity,
            size: selectedSize,
            color: selectedColor
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Carregando produto...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">Produto não encontrado</h1>
                    <Link href="/" className="text-blue-600 hover:underline">
                        Voltar para a página inicial
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center space-x-2 text-sm text-slate-600">
                        <Link href="/" className="hover:text-blue-600">Início</Link>
                        <span>/</span>
                        <Link href="/categorias" className="hover:text-blue-600">Categorias</Link>
                        <span>/</span>
                        <Link href={`/categoria/${product.category.toLowerCase()}`} className="hover:text-blue-600">
                            {product.category}
                        </Link>
                        <span>/</span>
                        <span className="text-slate-800 font-medium">{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Galeria de Imagens */}
                    <div className="space-y-4">
                        {/* Imagem Principal */}
                        <div className="relative bg-white rounded-2xl p-6 shadow-lg overflow-hidden">
                            <div className="aspect-square relative">
                                <Image
                                    src={product.images[selectedImageIndex]}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded-xl"
                                />
                                {product.discount > 0 && (
                                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        -{product.discount}%
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsFavorite(!isFavorite)}
                                    className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                                >
                                    <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Miniaturas */}
                        <div className="flex space-x-3">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`relative w-20 h-20 rounded-lg overflow-hidden ${selectedImageIndex === index
                                        ? 'ring-2 ring-blue-500'
                                        : 'ring-1 ring-slate-200'
                                        }`}
                                >
                                    <Image
                                        src={image}
                                        alt={`${product.name} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Informações do Produto */}
                    <div className="space-y-6">
                        {/* Cabeçalho */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-blue-600 font-medium">{product.brand}</span>
                                <span className="text-sm text-slate-400">SKU: {product.sku}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">{product.name}</h1>

                            {/* Avaliação */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < Math.floor(product.rating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-slate-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-slate-600 font-medium">{product.rating}</span>
                                <span className="text-slate-400">({product.reviewCount} avaliações)</span>
                            </div>
                        </div>

                        {/* Preço */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-4xl font-bold text-slate-800">
                                    R$ {(product.price * (1 - product.discount / 100)).toFixed(2).replace('.', ',')}
                                </span>
                                {product.originalPrice > product.price && (
                                    <div className="flex flex-col">
                                        <span className="text-lg text-slate-400 line-through">
                                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className="text-sm text-green-600 font-bold">
                                            Economize R$ {(product.originalPrice - product.price).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-600">ou 10x de R$ {((product.price * (1 - product.discount / 100)) / 10).toFixed(2).replace('.', ',')} sem juros</p>
                        </div>

                        {/* Variações */}
                        <div className="space-y-4">
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Cor: {selectedColor && <span className="text-blue-600">{selectedColor}</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        {product.colors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${selectedColor === color
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.sizes && product.sizes.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Armazenamento: {selectedSize && <span className="text-blue-600">{selectedSize}</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        {product.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${selectedSize === size
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quantidade */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Quantidade</label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border border-slate-200 rounded-lg">
                                    <button
                                        onClick={() => handleQuantityChange('decrease')}
                                        className="p-2 hover:bg-slate-50 transition-colors"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="px-4 py-2 font-medium">{quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange('increase')}
                                        className="p-2 hover:bg-slate-50 transition-colors"
                                        disabled={quantity >= product.stock}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-sm text-slate-600">
                                    {product.stock} unidades disponíveis
                                </span>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="space-y-3">
                            <button
                                onClick={handleBuyNow}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-full font-semibold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-5 h-5" />
                                Comprar Agora
                            </button>
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-slate-800 text-white py-4 rounded-full font-semibold text-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Adicionar ao Carrinho
                            </button>
                        </div>

                        {/* Benefícios */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Truck className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Frete Grátis</p>
                                    <p className="text-sm text-slate-600">Para compras acima de R$ 200</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Garantia de 2 anos</p>
                                    <p className="text-sm text-slate-600">Cobertura completa do fabricante</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <RotateCcw className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Troca Grátis</p>
                                    <p className="text-sm text-slate-600">30 dias para trocar ou devolver</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Abas de Informações */}
                <div className="mt-16">
                    <div className="border-b border-slate-200">
                        <nav className="flex space-x-8">
                            {[
                                { id: 'description', label: 'Descrição' },
                                { id: 'specifications', label: 'Especificações' },
                                { id: 'reviews', label: 'Avaliações' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-600 hover:text-slate-800'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="py-8">
                        {activeTab === 'description' && (
                            <div className="prose max-w-none">
                                <p className="text-slate-700 mb-6">{product.description}</p>

                                <h3 className="text-xl font-bold text-slate-800 mb-4">Características Principais:</h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {product.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <span className="text-slate-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <div key={key} className="flex justify-between py-3 border-b border-slate-200">
                                        <span className="font-medium text-slate-700">{key}:</span>
                                        <span className="text-slate-600">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6">
                                <div className="text-center py-12">
                                    <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600">As avaliações serão carregadas em breve.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Produtos Relacionados */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-3xl font-bold text-slate-800 mb-8">Produtos Relacionados</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    href={`/product/${relatedProduct.id}`}
                                    className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="aspect-square relative mb-4 overflow-hidden rounded-xl">
                                        <Image
                                            src={relatedProduct.image}
                                            alt={relatedProduct.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                                        {relatedProduct.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-slate-500">({relatedProduct.rating})</span>
                                    </div>
                                    <p className="text-xl font-bold text-slate-800">
                                        R$ {relatedProduct.price.toFixed(2).replace('.', ',')}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
