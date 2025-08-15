export const metadata = {
    title: "Frontend Admin",
    description: "Painel administrativo",
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
