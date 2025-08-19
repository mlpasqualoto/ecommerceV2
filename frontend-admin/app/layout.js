export const metadata = {
    title: "Frontend Admin",
    description: "Painel administrativo",
};

import "./globals.css";

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <body className="min-h-screen">{children}</body>
        </html>
    );
}
