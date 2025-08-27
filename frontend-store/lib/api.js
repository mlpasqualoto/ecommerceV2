export async function fetchProducts() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?status=active`);
    return res.json();
}
