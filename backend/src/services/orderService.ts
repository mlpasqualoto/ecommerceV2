import Order from "../models/Order";
import User from "../models/User";
import Product from "../models/Product";
import { OrderServiceResult } from "../controllers/orderController";

export async function createOrderService(userId: string, items: any[]): Promise<OrderServiceResult> {
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

export async function getOrdersService(userId: string): Promise<OrderServiceResult> {
    // Busca os pedidos do usuário
    const orders = await Order.find({ userId: userId });

    return { status: 200, message: "Pedidos encontrados com sucesso", orders: orders };
}

export async function getOrderByIdService(orderId: string, user: { id: string, role: string } | undefined): Promise<OrderServiceResult> {
    // Busca o pedido pelo ID
    const order = await Order.findById(orderId);

    if (!order) {
        return { status: 404, message: "Pedido não encontrado" };
    }

    // Se não for admin e o pedido não for do usuário logado, bloqueia
    if (!user || !user.id) {
        return { status: 401, message: "Usuário não autenticado" };
    }
    if (user.role !== "admin" && order.userId.toString() !== user.id) {
        return { status: 403, message: "Acesso negado" };
    }

    return { status: 200, message: "Pedido encontrado com sucesso", order: order };
}

export async function getOrdersByStatusService(status: string, user: { id: string } | undefined): Promise<OrderServiceResult> {
    // Valida o status
    const allowedStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
        return { status: 400, message: "Status inválido" };
    }

    // Busca os pedidos pelo status
    if (!user || !user.id) {
        return { status: 401, message: "Usuário não autenticado" };
    }
    const orders = await Order.find({ status, userId: user.id });

    if (orders.length === 0) {
        return { status: 404, message: "Nenhum pedido encontrado com o status especificado" };
    }

    return { status: 200, message: "Pedidos encontrados com sucesso", orders: orders };
}
