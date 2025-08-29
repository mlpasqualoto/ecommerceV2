import Image from "next/image";
import { cldUrl } from "@/lib/cld.js";
import { fetchProductById } from "@/lib/api.js";

export default async function ProductPage({ params }) {
    const { id } = params;
    const data = await fetchProductById(id);
    const product = data?.product;
    console.log(product);

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-600">
                Produto não encontrado
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-20 px-6">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-start">
                {/* Imagem */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    {product.images && product.images.length > 0 ? (
                        <Image
                            src={cldUrl(product.images[0].public_id, { width: 600, height: 600 })}
                            alt={product.name}
                            width={600}
                            height={600}
                            className="w-full h-auto rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-full h-96 flex items-center justify-center bg-slate-200 text-slate-500 rounded-xl">
                            Sem imagem
                        </div>
                    )}
                </div>

                {/* Detalhes */}
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">{product.name}</h1>
                    <p className="text-lg text-slate-600 mb-6">
                        {product.description || "Sem descrição disponível."}
                    </p>
                    <div className="text-3xl font-bold text-blue-600 mb-6">
                        R$ {product.price.toFixed(2)}
                    </div>

                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                        Comprar
                    </button>
                </div>
            </div>
        </main>
    );
}
