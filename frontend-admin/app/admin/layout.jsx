export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-800 text-white p-4">
        <h2 className="text-lg font-bold mb-4">Painel Admin</h2>
        <nav className="flex flex-col gap-2">
          <a href="/admin">Pedidos</a>
          <a href="/admin/products">Produtos</a>
          <a href="/admin/users">Usuários</a>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
