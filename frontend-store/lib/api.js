export async function fetchProducts() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/public`);
    return res.json();
}

export async function fetchProductById(id) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`);
    return res.json();
}
