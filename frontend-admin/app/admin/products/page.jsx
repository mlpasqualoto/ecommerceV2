"use client";
import { Fragment, useEffect, useState } from "react";
import {
  fetchProducts,
  fetchUpdateProduct,
  fetchProductById,
  fetchCreateProduct,
  fetchStatusProduct,
  fetchDeleteProduct,
} from "../../lib/api.js";
import { formatCurrencyBRL } from "../../utils/utils.js";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    cost: "",
    description: "",
    images: [],
    newImages: [],
    category: "",
    stock: 0,
    status: "",
    discount: 0,
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    cost: "",
    images: [],
    description: "",
    category: "",
    stock: 0,
    status: "",
    discount: 0,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, productId: null });
  const router = useRouter();

  // Função para recarregar/atualizar os dados
  const handleRefreshData = async () => {
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

      // Feedback visual de sucesso
      const refreshButton = document.querySelector("[data-refresh-btn]");
      refreshButton?.classList.add("animate-spin");
      setTimeout(() => {
        refreshButton?.classList.remove("animate-spin");
      }, 1000);
    } catch (err) {
      console.error("Erro ao atualizar pedidos:", err);
    } finally {
      setLoading(false);
      toggleProductDetails();
    }
  };

  // Função para exportar dados
  const handleExportData = () => {
    try {
      // Preparar dados para exportação
      const exportData = products.map((product) => ({
        ID: product._id,
        Nome: product.name,
        Preço: `R$ ${product.price.toFixed(2).replace(".", ",")}`,
        Descrição: product.description,
        Categoria: product.category,
        Estoque: product.stock,
        Status: getStatusText(product.status),
        Desconto: `${product.discount}%`,
      }));

      // Converter para CSV
      const csvContent = [
        // Cabeçalhos
        Object.keys(exportData[0] || {}).join(";"),
        // Dados
        ...exportData.map((row) => Object.values(row).join(";")),
      ].join("\n");

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `produtos_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Feedback visual
      const exportButton = document.querySelector("[data-export-btn]");
      exportButton?.classList.add("bg-green-200", "text-green-700");
      setTimeout(() => {
        exportButton?.classList.remove("bg-green-200", "text-green-700");
      }, 2000);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    }
  };

  // Animação de entrada da página
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Abre modal e preenche dados do produto
  const openEditModal = (product) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      cost: product.cost,
      images: product.images || [],
      newImages: [],
      description: product.description,
      category: product.category,
      stock: product.stock,
      status: product.status,
      discount: product.discount,
    });
  };

  // Fecha modal
  const closeEditModal = () => {
    setEditProduct(null);
    setEditForm({
      name: "",
      price: "",
      cost: "",
      images: [],
      newImages: [],
      description: "",
      category: "",
      stock: "",
      status: "",
      discount: "",
    });
  };

  // Toggle detalhes do produto
  const toggleProductDetails = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  // Atualiza campos do formulário
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Envia atualização
  const handleEditSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    if (!editProduct) return;

    const formData = new FormData();
    formData.append("name", editForm.name || "");
    formData.append("price", Number(editForm.price) || 0);
    formData.append("cost", Number(editForm.cost) || 0);
    formData.append("description", editForm.description || "");
    formData.append("category", editForm.category || "");
    formData.append("stock", Number(editForm.stock) || 0);
    formData.append("status", editForm.status || "");
    formData.append("discount", Number(editForm.discount) || 0);

    const existing = (editForm.images || []).filter(
      (img) => !(img instanceof File)
    );
    if (existing.length > 0) {
      formData.append("existingImages", JSON.stringify(existing));
    }

    (editForm.newImages || []).forEach((file) => {
      if (file instanceof File) {
        formData.append("images", file);
      }
    });

    console.log(formData);

    await handleUpdateProduct(editProduct._id, formData);

    setLoading(false);
    closeEditModal();
    handleRefreshData();
  };

  // Atualiza produto
  const handleUpdateProduct = async (productId, formData) => {
    const data = await fetchUpdateProduct(productId, formData);

    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }

    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? {
            ...product,
            name: formData.get("name"),
            price: formData.get("price"),
          }
          : product
      )
    );
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        console.log("Buscando produtos com status:", statusFilter);
        const data = await fetchProducts(statusFilter);
        console.log("Produtos encontrados:", data);

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
        toggleProductDetails();
      }
    };

    loadProducts();
  }, [statusFilter, router]);

  const handleFilterById = async (e) => {
    e.preventDefault();
    const productId = e.target.productId.value;
    if (!productId) return;

    const data = await fetchProductById(productId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }

    if (!data.product) {
      setProducts([]);
    } else {
      setProducts([data.product]);
      toggleProductDetails();
    }
  };

  const handleCreateProduct = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("cost", newProduct.cost);
    formData.append("description", newProduct.description);
    formData.append("category", newProduct.category);
    formData.append("stock", newProduct.stock);
    formData.append("status", newProduct.status);
    formData.append("discount", newProduct.discount);

    // Adicionar múltiplas imagens
    for (let i = 0; i < newProduct.images.length; i++) {
      formData.append("images", newProduct.images[i]);
    }

    const data = await fetchCreateProduct(formData);

    if (!data.product) {
      console.error("Produto não foi criado corretamente:", data);
      return;
    }

    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }

    setProducts((prevProducts) => [...prevProducts, data.product]);
    setNewProduct({
      name: "",
      price: "",
      cost: "",
      images: [],
      description: "",
      category: "",
      stock: 0,
      status: "",
      discount: 0,
    });
    setLoading(false);
    setIsCreateModalOpen(false);
  };

  const handleNewProductChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "images") {
      setNewProduct((prev) => ({ ...prev, [name]: Array.from(files) }));
    } else {
      setNewProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusProduct = async (productId, status) => {
    const newStatus = {
      status: status,
    };

    const data = await fetchStatusProduct(productId, newStatus);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setProducts((prevProducts) =>
      prevProducts.map((prod) =>
        prod._id === productId ? { ...prod, status: data.product.status } : prod
      )
    );
  };

  const handleDeleteProduct = async (ProductId) => {
    const data = await fetchDeleteProduct(ProductId);
    if (
      data?.message?.toLowerCase().includes("não autenticado") ||
      data?.error === "Unauthorized"
    ) {
      router.push("/login");
      return;
    }
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product._id !== ProductId)
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      inactive: "bg-amber-50 text-amber-700 border border-amber-200",
      out_of_stock: "bg-blue-50 text-blue-700 border border-blue-200",
      archived: "bg-red-50 text-red-700 border border-red-200",
      draft: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    };
    return (
      colors[status] || "bg-slate-50 text-slate-700 border border-slate-200"
    );
  };

  const getStatusText = (status) => {
    const texts = {
      active: "Ativo",
      inactive: "Inativo",
      out_of_stock: "Fora de Estoque",
      archived: "Arquivado",
      draft: "Rascunho",
    };
    return texts[status] || status;
  };

  // Loading state
  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-opacity duration-700 ${isPageLoaded ? "opacity-100" : "opacity-0"
        }`}
    >
      {/* Header Principal */}
      <div
        className={`bg-white border-b border-slate-200 shadow-sm transform transition-transform duration-500 ${isPageLoaded ? "translate-y-0" : "-translate-y-4"
          }`}
      >
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fadeInLeft">
              {/* Título com ícone */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M 16 11 V 7 a 4 4 0 0 0 -8 0 v 4 M 5 9 h 14 l 1 12 H 4 L 5 9 Z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Gerenciamento de Produtos
                </h1>
              </div>

              <p className="text-slate-600 max-w-2xl leading-relaxed">
                Controle completo sobre todos os produtos do seu e-commerce.
                Visualize, edite e gerencie o status de cada produto.
              </p>

              {/* Indicadores visuais */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Sistema Online</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Atualizado em tempo real</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 animate-fadeInRight">
              {/* Card de estatísticas melhorado */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  {/* Ícone de pedidos */}
                  <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl">
                    <svg
                      className="w-7 h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>

                  {/* Números e descrição */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 transition-all duration-300 hover:text-blue-600 leading-none">
                      {products.length}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {products.length === 1
                        ? "produto listado"
                        : "produtos listados"}
                    </div>
                    <div className="flex items-center justify-end space-x-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
                        Ativo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de ações rápidas (opcional) */}
              <div className="flex flex-col gap-4 items-center">
                {/* Botão de atualizar dados */}
                <button
                  onClick={handleRefreshData}
                  data-refresh-btn
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 group cursor-pointer"
                  title="Atualizar dados"
                  disabled={loading}
                >
                  <svg
                    className={`w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-all duration-200 ${loading ? "animate-spin" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                {/* Botão de exportar dados */}
                <button
                  onClick={handleExportData}
                  data-export-btn
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 group cursor-pointer"
                  title="Exportar dados (CSV)"
                  disabled={products.length === 0}
                >
                  <svg
                    className="w-5 h-5 text-slate-600 group-hover:text-slate-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-8 py-8">
        {/* Modal de Edição */}
        {editProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn">
            <div className="bg-white rounded-l-2xl shadow-2xl w-full max-w-xl h-full border-l border-slate-200 transform animate-slideInRight flex flex-col">

              {/* Cabeçalho fixo */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Editar Produto</h2>
                  <p className="text-sm text-slate-600 mt-1">ID: {editProduct._id}</p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="cursor-pointer bg-red-50 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.1s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Nome
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={editForm.name || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Preço de custo
                  </label>
                  <input
                    name="cost"
                    type="text"
                    value={editForm.cost || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Preço
                  </label>
                  <input
                    name="price"
                    type="text"
                    value={editForm.price || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                  />
                </div>

                {editProduct && (
                  <div>
                    {/* Área de Upload (edição) */}
                    <div className="space-y-2 animate-slideInUp">
                      <label className="block text-sm font-semibold text-slate-700">
                        Imagens
                      </label>

                      <label
                        htmlFor="edit-images"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-400 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                      >
                        <svg
                          className="w-10 h-10 text-blue-500 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4a2 2 0 012-2h6a2 2 0 012 2v12M7 16h10m-5 4h.01"
                          />
                        </svg>
                        <span className="text-sm text-blue-600 font-medium">
                          Clique para adicionar mais imagens
                        </span>
                        <input
                          id="edit-images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              newImages: [
                                ...(prev?.newImages || []),
                                ...Array.from(e.target.files),
                              ],
                            }))
                          }
                        />
                      </label>

                      {/* Imagens já existentes (vindas do banco) */}
                      {editForm.images?.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {editForm.images.map((img, index) => (
                            <div
                              key={index}
                              className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                            >
                              <img
                                src={typeof img === "string" ? img : img.url}
                                alt={`product-image-${index}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    images: prev.images.filter(
                                      (_, i) => i !== index
                                    ),
                                  }))
                                }
                                className="cursor-pointer absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow hover:bg-red-600 transition"
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Novas imagens adicionadas agora (arquivos File) */}
                      {editForm.newImages?.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {editForm.newImages.map((file, index) => (
                            <div
                              key={index}
                              className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`new-preview-${index}`}
                                className="w-full h-full object-cover"
                                onLoad={(e) =>
                                  URL.revokeObjectURL(e.currentTarget.src)
                                } // libera memória
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    newImages: prev.newImages.filter(
                                      (_, i) => i !== index
                                    ),
                                  }))
                                }
                                className="cursor-pointer absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow hover:bg-red-600 transition"
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Descrição
                  </label>
                  <input
                    name="description"
                    type="text"
                    value={editForm.description || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.4s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Categoria
                  </label>
                  <input
                    name="category"
                    type="text"
                    value={editForm.category || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.5s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Estoque
                  </label>
                  <input
                    name="stock"
                    type="text"
                    value={editForm.stock || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.6s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editForm.status || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-slate-900 hover:border-slate-300"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="out_of_stock">Fora de estoque</option>
                    <option value="archived">Arquivado</option>
                    <option value="draft">Rascunho</option>
                  </select>
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.7s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={editForm.discount || 0}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div
                  className="flex justify-end space-x-3 pt-6 animate-slideInUp"
                  style={{ animationDelay: "0.8s" }}
                >
                  <button
                    type="button"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                    onClick={closeEditModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 hover:shadow-xl"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn">
            <div className="bg-white rounded-l-2xl shadow-2xl w-full max-w-xl h-full border-l border-slate-200 transform animate-slideInRight flex flex-col">

              {/* Cabeçalho fixo */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Criar Novo Produto</h2>
                  <p className="text-sm text-slate-600 mt-1">Adicione um novo produto ao sistema</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="cursor-pointer bg-red-50 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct} autoComplete="off" className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.1s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleNewProductChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300 auto-complete-"
                    placeholder="Digite o nome do produto"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Custo
                  </label>
                  <input
                    type="text"
                    name="cost"
                    value={newProduct.cost}
                    onChange={handleNewProductChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                    placeholder="Digite o custo do produto"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Preço
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={newProduct.price}
                    onChange={handleNewProductChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                    placeholder="Digite o preço do produto"
                    required
                  />
                </div>

                <div className="space-y-2 animate-slideInUp">
                  <label className="block text-sm font-semibold text-slate-700">
                    Imagens
                  </label>

                  {/* Área de Upload */}
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-400 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                  >
                    <svg
                      className="w-10 h-10 text-blue-500 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4a2 2 0 012-2h6a2 2 0 012 2v12M7 16h10m-5 4h.01"
                      />
                    </svg>
                    <span className="text-sm text-blue-600 font-medium">
                      Clique para adicionar mais imagens
                    </span>
                    <input
                      id="images"
                      type="file"
                      name="images"
                      accept="image/*"
                      multiple
                      onChange={handleNewProductChange}
                      className="hidden"
                      required
                    />
                  </label>

                  {/* Pré-visualização */}
                  {newProduct.images && newProduct.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {newProduct.images.map((file, index) => (
                        <div
                          key={index}
                          className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`preview-${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewProduct((prev) => ({
                                ...prev,
                                images: prev.images.filter(
                                  (_, i) => i !== index
                                ),
                              }))
                            }
                            className="cursor-pointer absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow hover:bg-red-600 transition"
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Descrição
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={newProduct.description}
                    onChange={handleNewProductChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                    placeholder="Digite a descrição do produto"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.4s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Categoria
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={newProduct.category}
                    onChange={handleNewProductChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="1"
                    placeholder="Digite a categoria do produto"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.5s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Estoque
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleNewProductChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                    placeholder="Digite a quantidade em estoque"
                    required
                  />
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.6s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newProduct.status || ""}
                    onChange={handleNewProductChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-slate-900 hover:border-slate-300"
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="out_of_stock">Fora de estoque</option>
                    <option value="archived">Arquivado</option>
                    <option value="draft">Rascunho</option>
                  </select>
                </div>

                <div
                  className="space-y-2 animate-slideInUp"
                  style={{ animationDelay: "0.7s" }}
                >
                  <label className="block text-sm font-semibold text-slate-700">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={newProduct.discount}
                    onChange={handleNewProductChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    min="0"
                    max="100"
                    placeholder="Digite o desconto do produto (se houver)"
                  />
                </div>

                <div
                  className="flex justify-end space-x-3 pt-6 animate-slideInUp"
                  style={{ animationDelay: "0.8s" }}
                >
                  <button
                    type="button"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 hover:shadow-xl"
                  >
                    Criar Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-fadeIn">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm({ open: false, productId: null })}
                  className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDeleteProduct(deleteConfirm.productId);
                    setDeleteConfirm({ open: false, productId: null });
                  }}
                  className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Controles */}
        <div
          className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 transform transition-all duration-500 hover:shadow-md ${isPageLoaded
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
            }`}
          style={{ transitionDelay: "0.1s" }}
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Busca por ID */}
              <form
                onSubmit={handleFilterById}
                className="flex items-center gap-3 animate-slideInUp"
                style={{ animationDelay: "0.2s" }}
              >
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Buscar por ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="productId"
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-mono min-w-[200px] placeholder:text-slate-300 text-slate-900 hover:border-slate-300"
                    placeholder="ID do produto..."
                  />
                  <button
                    type="submit"
                    className="cursor-pointer px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    Buscar
                  </button>
                </div>
              </form>

              {/* Filtro por Status */}
              <div
                className="flex items-center gap-3 animate-slideInUp"
                style={{ animationDelay: "0.3s" }}
              >
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Filtrar por Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium min-w-[140px] text-slate-900 hover:border-slate-300"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="out_of_stock">Fora de estoque</option>
                  <option value="archived">Arquivado</option>
                  <option value="draft">Rascunho</option>
                </select>
              </div>
            </div>

            {/* Botão Novo Produto */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg flex items-center gap-2 whitespace-nowrap transform hover:scale-105 hover:shadow-xl animate-slideInUp"
              style={{ animationDelay: "0.4s" }}
            >
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Novo Produto
            </button>
          </div>
        </div>

        {/* Tabela de Produtos Otimizada */}
        <div
          className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transform transition-all duration-500 hover:shadow-md ${isPageLoaded
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
            }`}
          style={{ transitionDelay: "0.2s" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length > 0 ? (
                  products.map((product, idx) =>
                    product ? (
                      <Fragment key={product._id || idx}>
                        {/* Linha Principal */}
                        <tr
                          key={product._id || idx}
                          className="hover:bg-slate-50 transition-all duration-200 group animate-fadeInUp"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <td className="px-6 py-5 flex gap-4 items-center">
                            {product.images?.length > 0 && (
                              <img
                                src={typeof product.images[0] === "string" ? product.images[0] : product.images[0].url}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-md border"
                              />
                            )}
                            <div className="flex flex-col">
                              <div className="text-sm font-semibold text-slate-900 max-w-[200px] truncate transition-colors duration-200 group-hover:text-blue-600">
                                {product.name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                #{product._id}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            {product.discount && product.discount > 0 ? (
                              <div className="flex flex-col items-center">
                                {/* Preço com desconto (principal) */}
                                <div className="text-[15px] font-bold text-slate-900 transition-colors duration-200 group-hover:text-emerald-600">
                                  {formatCurrencyBRL(product.price - (product.price * (product.discount / 100)))}
                                </div>

                                {/* Preço original + badge de desconto */}
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                  <span className="text-slate-400 line-through">
                                    {formatCurrencyBRL(product.price)}
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                                    -{product.discount}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[15px] font-bold text-slate-900 transition-colors duration-200 group-hover:text-emerald-600">
                                {formatCurrencyBRL(product.price)}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 text-sm font-bold rounded-full transition-all duration-200 group-hover:bg-blue-100 group-hover:text-blue-700">
                              {product.stock}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${getStatusColor(
                                product.status
                              )}`}
                            >
                              {getStatusText(product.status)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="cursor-pointer p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                onClick={() => openEditModal(product)}
                                title="Editar produto"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>

                              <button
                                className="cursor-pointer p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                onClick={() => setDeleteConfirm({ open: true, productId: product._id })}
                                title="Deletar produto"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <button
                              className="cursor-pointer p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                              onClick={() => toggleProductDetails(product._id)}
                              title={
                                expandedProduct === product._id
                                  ? "Ocultar detalhes"
                                  : "Ver detalhes"
                              }
                            >
                              <svg
                                className={`w-4 h-4 transition-transform duration-300 ${expandedProduct === product._id
                                  ? "rotate-180"
                                  : ""
                                  }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Linha de Detalhes Expandida */}
                        {expandedProduct === product._id && (
                          <tr
                            key={`${product._id}-details`}
                            className="bg-slate-50 animate-slideDown"
                          >
                            <td colSpan="6" className="px-6 py-6">
                              <div className="bg-white rounded-xl p-6 border border-slate-200 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {/* Informações Básicas */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.1s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Informações do Produto
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          ID
                                        </label>
                                        <p className="text-sm font-mono text-slate-900">
                                          {product._id}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Nome
                                        </label>
                                        <p className="text-sm text-slate-900 font-medium">
                                          {product.name}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Categoria
                                        </label>
                                        <p className="text-sm text-slate-900">
                                          {product.category}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Imagens
                                        </label>
                                        <div className="flex gap-2 pt-1 overflow-x-auto">
                                          {product.images.map((image, index) => (
                                            <img
                                              key={index}
                                              src={typeof image === "string" ? image : image.url}
                                              alt={product.name}
                                              className="w-16 h-16 object-cover rounded-md border"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Descrição e Preços */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.2s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Descrição e Preços
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Descrição
                                        </label>
                                        <p className="text-sm text-slate-900">
                                          {product.description}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Desconto
                                        </label>
                                        {product.discount && product.discount > 0 ? (
                                          <p className="text-sm text-slate-900 font-semibold">
                                            {`${product.discount || 0}%`}
                                          </p>
                                        ) : (
                                          <p className="text-sm text-slate-500">
                                            Sem desconto
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Preço de custo
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm text-slate-900 font-semibold">
                                            {formatCurrencyBRL(product.cost)}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Preço
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm text-slate-900 font-semibold">
                                            {formatCurrencyBRL(product.price * (1 - (product.discount || 0) / 100))}
                                          </p>
                                          <p>
                                            {product.discount && product.discount > 0 ? (
                                              <span className="text-sm text-slate-500 line-through mr-2">
                                                {formatCurrencyBRL(product.price)}
                                              </span>
                                            ) : null}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status e Data */}
                                  <div
                                    className="space-y-4 animate-slideInUp"
                                    style={{ animationDelay: "0.3s" }}
                                  >
                                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Status e Datas
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Status Atual
                                        </label>
                                        <div className="mt-1">
                                          <span
                                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${getStatusColor(
                                              product.status
                                            )}`}
                                          >
                                            {getStatusText(product.status)}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Estoque
                                        </label>
                                        <p className="text-sm text-slate-900 font-semibold">
                                          {product.stock} unidades
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Criado em
                                        </label>
                                        <p className="text-sm text-slate-900">
                                          {new Date(
                                            product.createdAt
                                          ).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Ações Rápidas */}
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-4">
                                    Ações Rápidas de Status
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="cursor-pointer px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() =>
                                        handleStatusProduct(
                                          product._id,
                                          "active"
                                        )
                                      }
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10.854 8.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0"
                                        />
                                        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                      </svg>
                                      Ativar
                                    </button>

                                    <button
                                      className="cursor-pointer px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() =>
                                        handleStatusProduct(
                                          product._id,
                                          "inactive"
                                        )
                                      }
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.5 10a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5"
                                        />
                                        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                      </svg>
                                      Inativar
                                    </button>

                                    <button
                                      className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() =>
                                        handleStatusProduct(
                                          product._id,
                                          "out_of_stock"
                                        )
                                      }
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"
                                        />
                                        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                      </svg>
                                      Sem Estoque
                                    </button>

                                    <button
                                      className="cursor-pointer px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105"
                                      onClick={() =>
                                        handleStatusProduct(
                                          product._id,
                                          "archived"
                                        )
                                      }
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                      >
                                        <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" />
                                      </svg>
                                      Arquivar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ) : null
                  )
                ) : (
                  <tr key="no-products">
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4 animate-fadeIn">
                        <div className="relative">
                          <svg
                            className="w-16 h-16 text-slate-300 animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1"
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                          <div className="absolute inset-0 bg-slate-300/30 rounded-full animate-ping"></div>
                        </div>
                        <div
                          className="text-slate-500 animate-slideInUp"
                          style={{ animationDelay: "0.2s" }}
                        >
                          <div className="text-lg font-semibold mb-2">
                            Nenhum produto encontrado
                          </div>
                          <div className="text-sm max-w-sm mx-auto leading-relaxed">
                            Não há produtos com os filtros selecionados. Tente
                            ajustar os critérios de busca ou criar um novo
                            produto.
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
        <div
          className={`mt-8 text-center text-sm text-slate-500 animate-fadeIn ${isPageLoaded ? "opacity-100" : "opacity-0"
            }`}
          style={{ transitionDelay: "0.3s" }}
        >
          <p>
            Painel de Administração • Total de {products.length} produtos
            listados
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        .animate-fadeInLeft {
          animation: fadeInLeft 0.6s ease-out forwards;
        }

        .animate-fadeInRight {
          animation: fadeInRight 0.6s ease-out forwards;
        }
      `}</style>
    </div >
  );
}
