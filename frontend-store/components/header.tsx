"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Menu, X, Heart } from "lucide-react";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Implementar lógica de busca aqui
            console.log("Buscando por:", searchQuery);
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center">
                <p className="text-sm font-medium">
                    🎉 Frete grátis para compras acima de R$ 200,00 | Entrega em todo Brasil
                </p>
            </div>

            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            MinhaLoja
                        </span>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <input
                                type="text"
                                placeholder="Buscar produtos, marcas ou categorias..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-1.5 rounded-full hover:shadow-lg transition-all duration-200 text-sm font-medium"
                            >
                                Buscar
                            </button>
                        </form>
                    </div>

                    {/* Navigation - Desktop */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        <Link href="/categorias" className="text-slate-700 hover:text-blue-600 transition-colors">
                            Categorias
                        </Link>
                        <Link href="/ofertas" className="text-slate-700 hover:text-blue-600 transition-colors">
                            Ofertas
                        </Link>
                        <Link href="/sobre" className="text-slate-700 hover:text-blue-600 transition-colors">
                            Sobre
                        </Link>
                        <Link href="/contato" className="text-slate-700 hover:text-blue-600 transition-colors">
                            Contato
                        </Link>
                    </nav>

                    {/* User Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Search Button - Mobile */}
                        <button className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <Search className="w-5 h-5 text-slate-600" />
                        </button>

                        {/* Wishlist */}
                        <Link
                            href="/favoritos"
                            className="relative p-2 hover:bg-slate-100 rounded-full transition-colors group"
                        >
                            <Heart className="w-5 h-5 text-slate-600 group-hover:text-red-500 transition-colors" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                2
                            </span>
                        </Link>

                        {/* Cart */}
                        <Link
                            href="/carrinho"
                            className="relative p-2 hover:bg-slate-100 rounded-full transition-colors group"
                        >
                            <ShoppingBag className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                3
                            </span>
                        </Link>

                        {/* User Account */}
                        <Link
                            href="/conta"
                            className="hidden sm:flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <User className="w-5 h-5 text-slate-600" />
                            <span className="text-sm text-slate-700 hidden md:block">Minha Conta</span>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            {isMenuOpen ? (
                                <X className="w-5 h-5 text-slate-600" />
                            ) : (
                                <Menu className="w-5 h-5 text-slate-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 py-4">
                        {/* Mobile Search */}
                        <div className="mb-4">
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar produtos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </form>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="space-y-3">
                            <Link
                                href="/categorias"
                                className="block py-2 text-slate-700 hover:text-blue-600 transition-colors"
                            >
                                Categorias
                            </Link>
                            <Link
                                href="/ofertas"
                                className="block py-2 text-slate-700 hover:text-blue-600 transition-colors"
                            >
                                Ofertas
                            </Link>
                            <Link
                                href="/sobre"
                                className="block py-2 text-slate-700 hover:text-blue-600 transition-colors"
                            >
                                Sobre
                            </Link>
                            <Link
                                href="/contato"
                                className="block py-2 text-slate-700 hover:text-blue-600 transition-colors"
                            >
                                Contato
                            </Link>
                            <Link
                                href="/conta"
                                className="flex items-center space-x-2 py-2 text-slate-700 hover:text-blue-600 transition-colors"
                            >
                                <User className="w-4 h-4" />
                                <span>Minha Conta</span>
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
