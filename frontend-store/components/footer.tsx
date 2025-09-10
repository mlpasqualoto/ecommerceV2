import Link from "next/link";
import { ShoppingBag, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-white">
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                MinhaLoja
                            </span>
                        </Link>
                        <p className="text-slate-300 leading-relaxed">
                            Sua loja online de confiança com os melhores produtos,
                            preços competitivos e entrega rápida para todo o Brasil.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
                        <ul className="space-y-2">
                            <li><Link href="/categorias" className="text-slate-300 hover:text-white transition-colors">Categorias</Link></li>
                            <li><Link href="/ofertas" className="text-slate-300 hover:text-white transition-colors">Ofertas</Link></li>
                            <li><Link href="/lancamentos" className="text-slate-300 hover:text-white transition-colors">Lançamentos</Link></li>
                            <li><Link href="/mais-vendidos" className="text-slate-300 hover:text-white transition-colors">Mais Vendidos</Link></li>
                            <li><Link href="/avaliacoes" className="text-slate-300 hover:text-white transition-colors">Avaliações</Link></li>
                        </ul>
                    </div>

                    {/* Customer Support */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Atendimento</h3>
                        <ul className="space-y-2">
                            <li><Link href="/central-ajuda" className="text-slate-300 hover:text-white transition-colors">Central de Ajuda</Link></li>
                            <li><Link href="/trocas-devolucoes" className="text-slate-300 hover:text-white transition-colors">Trocas e Devoluções</Link></li>
                            <li><Link href="/entrega" className="text-slate-300 hover:text-white transition-colors">Informações de Entrega</Link></li>
                            <li><Link href="/pagamento" className="text-slate-300 hover:text-white transition-colors">Formas de Pagamento</Link></li>
                            <li><Link href="/garantia" className="text-slate-300 hover:text-white transition-colors">Garantia</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contato</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Phone className="w-5 h-5 text-blue-400" />
                                <span className="text-slate-300">(11) 9999-9999</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="w-5 h-5 text-blue-400" />
                                <span className="text-slate-300">contato@minhaloja.com</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
                                <span className="text-slate-300">
                                    Rua das Flores, 123<br />
                                    Centro, São Paulo - SP<br />
                                    CEP: 01000-000
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Newsletter Section */}
            <div className="border-t border-slate-800">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Receba nossas ofertas</h3>
                            <p className="text-slate-400">Cadastre-se e seja o primeiro a saber das promoções!</p>
                        </div>
                        <div className="flex w-full md:w-auto">
                            <input
                                type="email"
                                placeholder="Seu e-mail"
                                className="flex-1 md:w-80 px-4 py-3 bg-slate-800 border border-slate-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                            />
                            <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-r-lg hover:shadow-lg transition-all duration-200 whitespace-nowrap">
                                Inscrever-se
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="border-t border-slate-800 bg-slate-950">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="text-slate-400 text-sm">
                            © 2025 MinhaLoja. Todos os direitos reservados.
                        </div>
                        <div className="flex flex-wrap items-center space-x-6 text-sm">
                            <Link href="/privacidade" className="text-slate-400 hover:text-white transition-colors">
                                Política de Privacidade
                            </Link>
                            <Link href="/termos" className="text-slate-400 hover:text-white transition-colors">
                                Termos de Uso
                            </Link>
                            <Link href="/cookies" className="text-slate-400 hover:text-white transition-colors">
                                Cookies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
