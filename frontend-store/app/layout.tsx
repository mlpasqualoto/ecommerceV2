import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/header";
import Footer from "../components/footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loja Online - Os Melhores Produtos com Entrega Rápida",
  description: "Descubra produtos incríveis com qualidade excepcional, preços competitivos e entrega rápida. Sua melhor experiência de compra online.",
  keywords: "loja online, e-commerce, produtos, entrega rápida, qualidade, compras",
  authors: [{ name: "Sua Loja" }],
  openGraph: {
    title: "Loja Online - Os Melhores Produtos",
    description: "Descubra produtos incríveis com qualidade excepcional e entrega rápida",
    type: "website",
    locale: "pt_BR",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} antialiased bg-white text-slate-900`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
