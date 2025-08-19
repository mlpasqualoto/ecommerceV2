"use client";
import { useEffect, useState } from "react";
import { fetchProducts, fetchUpdateProduct } from "@/app/lib/api.js"
import { useRouter } from "next/navigation";

export default function ProductsPage() {
    const [statusFilter, setStatusFilter] = useState("active");
    const [products, setProducts] = useState([]);
    const [editProduct, setEditProduct] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', price: '', description: '', category: '', stock: '', status: '', discount: '' });
    const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: '', stock: '', status: '', discount: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Abre modal e preenche dados do produto
    const openEditModal = (product) => {
        setEditProduct(product);
        setEditForm({ name: product.name, price: product.price, description: product.description, category: product.category, stock: product.stock, status: product.status, discount: product.discount });
    };

    // Fecha modal
    const closeEditModal = () => {
        setEditProduct(null);
        setEditForm({ name: '', price: '', description: '', category: '', stock: '', status: '', discount: '' });
    };

    // Atualiza campos do formulário
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    // Envia atualização
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editProduct) return;
        await handleUpdateProduct(editProduct.id, {
            name: editForm.name,
            price: Number(editForm.price),
            description: editForm.description,
            category: editForm.category,
            stock: Number(editForm.stock),
            status: editForm.status,
            discount: Number(editForm.discount),
        });
        closeEditModal();
    };

    // Atualiza produto
    const handleUpdateProduct = async (productId, updatedData) => {
        const data = await fetchUpdateProduct(productId, updatedData);
        if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
            router.push("/login");
            return;
        }
        setProducts((prevProducts) =>
            prevProducts.map((product) => (product.id === productId ? { ...product, ...updatedData } : product))
        );
    };

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const data = await fetchProducts(statusFilter);

                if (
                    data?.message?.toLowerCase().includes("não autenticado") ||
                    data?.error === "Unauthorized"
                ) {
                    router.push("/login");
                    return;
                }

                setProducts(data.products || []);
            } catch (err) {
                console.error("Erro ao buscar produtos:", err);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [statusFilter, router]);

    const handleCreateProduct = async (e) => {
        e.preventDefault();

        const newProductData = {
            name: newProduct.name,
            price: Number(newProduct.price),
            description: newProduct.description,
            category: newProduct.category,
            stock: Number(newProduct.stock),
            status: newProduct.status,
            discount: Number(newProduct.discount),
        };

        const data = await fetchCreateProduct(newProductData);
        console.log(data);

        if (!data.product) {
            console.error("Produto não foi criado corretamente:", data);
            return;
        }

        if (data?.message?.toLowerCase().includes("não autenticado") || data?.error === "Unauthorized") {
            router.push("/login");
            return;
        }

        setProducts((prevProducts) => [...prevProducts, data.product]);
        setNewProduct({ name: "", price: "", description: "", category: "", stock: "", status: "", discount: "" });
        setIsCreateModalOpen(false);
    };

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProduct((prev) => ({ ...prev, [name]: value }));
    };

    const getStatusColor = (status) => {
        const colors = {
            active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            inactive: "bg-amber-50 text-amber-700 border border-amber-200",
            out_of_stock: "bg-blue-50 text-blue-700 border border-blue-200",
            archived: "bg-green-50 text-green-700 border border-green-200",
            draft: "bg-red-50 text-red-700 border border-red-200"
        };
        return colors[status] || "bg-slate-50 text-slate-700 border border-slate-200";
    };

    const getStatusText = (status) => {
        const texts = {
            active: "Ativo",
            inactive: "Inativo",
            out_of_stock: "Fora de Estoque",
            archived: "Arquivado",
            draft: "Rascunho"
        };
        return texts[status] || status;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-slate-600 font-medium">Carregando pedidos...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Principal */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gerenciamento de Produtos</h1>
                            <p className="mt-2 text-slate-600 max-w-2xl">
                                Controle completo sobre todos os produtos do seu e-commerce. Visualize, edite e gerencie o status de cada produto.
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{products.length}</div>
                                <div className="text-sm text-slate-500">produtos listados</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1550px] mx-auto px-8 py-8">

                {/* Modal de Edição */}
                {editProduct && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200">
                            <div className="px-8 py-6 border-b border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900">Editar Produto</h2>
                                <p className="text-sm text-slate-600 mt-1">ID: {editProduct._id}</p>
                            </div>

                            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Nome</label>
                                    <input
                                        name="name"
                                        type="text"
                                        value={editForm.name}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        min="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Preço</label>
                                    <input
                                        name="price"
                                        type="text"
                                        value={editForm.price}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        min="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Descrição</label>
                                    <input
                                        name="description"
                                        type="text"
                                        value={editForm.description}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        min="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Categoria</label>
                                    <input
                                        name="category"
                                        type="text"
                                        value={editForm.category}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        min="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Estoque</label>
                                    <input
                                        name="stock"
                                        type="text"
                                        value={editForm.stock}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        min="1"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Status</label>
                                    <select
                                        name="status"
                                        value={editForm.status}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="out_of_stock">Fora de estoque</option>
                                        <option value="archived">Arquivado</option>
                                        <option value="draft">Rascunho</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Desconto (R$)</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        value={editForm.discount}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-6">
                                    <button
                                        type="button"
                                        className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                                        onClick={closeEditModal}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg"
                                    >
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Criação */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200">
                            <div className="px-8 py-6 border-b border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900">Criar Novo Produto</h2>
                                <p className="text-sm text-slate-600 mt-1">Adicione um novo produto ao sistema</p>
                            </div>

                            <form onSubmit={handleCreateProduct} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Produto ID</label>
                                    <input
                                        type="text"
                                        name="productId"
                                        value={newProduct.productId}
                                        onChange={handleNewProductChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        placeholder="Digite o ID do produto"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Quantidade</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={newProduct.quantity}
                                        onChange={handleNewProductChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300 text-slate-900"
                                        min="1"
                                        placeholder="Quantidade de itens"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-6">
                                    <button
                                        type="button"
                                        className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                                        onClick={() => setIsCreateModalOpen(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg"
                                    >
                                        Criar Produto
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Barra de Controles */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">

                            {/* Filtro por Status */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Filtrar por Status:</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium min-w-[140px] text-slate-900"
                                >
                                    <option value="paid">Pago</option>
                                    <option value="pending">Pendente</option>
                                    <option value="shipped">Enviado</option>
                                    <option value="delivered">Entregue</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>

                            {/* Busca por ID */}
                            <form onSubmit={handleFilterById} className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Buscar por ID:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="orderId"
                                        className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-mono min-w-[200px] placeholder:text-slate-300 text-slate-900"
                                        placeholder="ID do pedido..."
                                    />
                                    <button
                                        type="submit"
                                        className="cursor-pointer px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all"
                                    >
                                        Buscar
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Botão Novo Pedido */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="cursor-pointer px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Novo Pedido
                        </button>
                    </div>
                </div>

                {/* Tabela de Pedidos */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ID do Pedido</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Data & Hora</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Produto</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Qtd</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Preço Unit.</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.length > 0 ? products.map((product, idx) => (
                                    product ? (
                                        <tr key={product._id || idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-mono text-sm text-slate-900 font-semibold">
                                                    #{product._id}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {new Date(product.createdAt).toLocaleString("pt-BR", {
                                                        timeZone: "America/Sao_Paulo",
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "2-digit",
                                                    })}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(product.createdAt).toLocaleString("pt-BR", {
                                                        timeZone: "America/Sao_Paulo",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-sm font-semibold text-slate-900 max-w-[200px] truncate">
                                                    {product.name}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-sm font-semibold text-slate-900 max-w-[200px] truncate">
                                                    {product.description}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-sm font-semibold text-slate-900 max-w-[200px] truncate">
                                                    {product.category}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 text-sm font-bold rounded-full">
                                                    {product.stock}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    R$ {Number(product.price).toFixed(2)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                                                    {getStatusText(product.status)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        className="cursor-pointer p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                                                        onClick={() => openEditModal(product)}
                                                        title="Editar produto"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        className="cursor-pointer p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                                                        onClick={() => handlePayOrder(order._id)}
                                                        title="Marcar como pago"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-credit-card" viewBox="0 0 16 16">
                                                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
                                                            <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        className="cursor-pointer p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all"
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        title="Cancelar pedido"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        className="cursor-pointer p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                                                        onClick={() => handleDeleteOrder(order._id)}
                                                        title="Deletar pedido"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null
                                )) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center space-y-4">
                                                <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                                <div className="text-slate-500">
                                                    <div className="text-lg font-semibold mb-2">Nenhum pedido encontrado</div>
                                                    <div className="text-sm max-w-sm mx-auto leading-relaxed">
                                                        Não há pedidos com os filtros selecionados. Tente ajustar os critérios de busca ou criar um novo pedido.
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer com informações extras */}
                <div className="mt-8 text-center text-sm text-slate-500">
                    <p>Painel de Administração • Total de {products.length} produtos listados</p>
                </div>
            </div>
        </div>
    );
}