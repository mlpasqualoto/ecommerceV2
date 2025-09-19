import Order from "../models/Order";
import User from "../models/User";
import Product from "../models/Product";


export async function createOrderService(userId: string, items: any[]) {
    // Busca o usuário no banco para pegar o userName
    const user = await User.findById(userId);
    if (!user) {
        return { status: 404, message: "Usuário não encontrado" };
    }

    // Monta os items preenchendo name e price do produto
    const orderItems = await Promise.all(
        items.map(async (item: { productId: string; quantity: number; }) => {
            const product: any = await Product.findById(item.productId);
            if (!product) {
                throw new Error(`Produto com ID ${item.productId} não encontrado`);
            }

            const originalPrice = product.price;

            // Aplica o desconto, se houver
            const price = product.discount > 0
                ? product.price - (product.price * product.discount / 100)
                : product.price;

            return {
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                originalPrice,
                discount: product.discount,
                price,
                imageUrl: product.images && product.images.length > 0
                    ? product.images[0].url
                    : ""
            };
        })
    );

    // Calcula o total
    const totalAmount = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
    const totalQuantity = orderItems.reduce((acc, item) => acc + item.quantity, 0);

    // Cria e salva o pedido
    const order = new Order({
        userId: user._id,
        userName: user.userName, // salva no banco também
        name: user.name,
        items: orderItems,
        totalAmount,
        totalQuantity,
        status: "pending"
    });

    const savedOrder = await order.save();

    return { status: 201, message: "Pedido criado com sucesso", order: savedOrder };
}
