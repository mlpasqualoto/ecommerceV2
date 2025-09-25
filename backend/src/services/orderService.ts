import Order from "../models/Order";
import User from "../models/User";
import Product from "../models/Product";
import {
    OrderServiceResult,
    UpdateOrderDTO,
    IOrder,
    CreateOrderDTO
} from "../types/orderTypes";
import { isValidDate } from "../utils/utils";

export async function createOrderService(userId: string, items: CreateOrderDTO[]): Promise<OrderServiceResult> {
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
            const price = product.discount > 0 ? product.price - (product.price * product.discount / 100) : product.price;

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

export async function getAllOrdersByStatusService(status: string): Promise<OrderServiceResult> {
    // Valida o status
    const allowedStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
        return { status: 400, message: "Status inválido" };
    }

    // Busca todos os pedidos com o status informado
    const orders = await Order.find({ status });
    if (orders.length === 0) {
        return { status: 404, message: "Nenhum pedido encontrado com o status especificado" };
    }

    return { status: 200, message: "Pedidos encontrados com sucesso", orders: orders };
}

export async function getOrdersByDateService(date: string, user: { id: string } | undefined): Promise<OrderServiceResult> {
    // Valida a data
    if (!isValidDate(date)) {
        return { status: 400, message: "Data inválida" };
    }

    if (!user || !user.id) {
        return { status: 401, message: "Usuário não autenticado" };
    }
    const orders = await Order.find({ userId: user.id, createdAt: { $gte: new Date(date), $lt: new Date(date + "T23:59:59") } });

    if (orders.length === 0) {
        return { status: 404, message: "Nenhum pedido encontrado com a data especificada" };
    }

    return { status: 200, message: "Pedidos encontrados com sucesso", orders: orders };
}

export async function getAllOrdersByDateService(date: string): Promise<OrderServiceResult> {
    // Valida a data
    if (!isValidDate(date)) {
        return { status: 400, message: "Data inválida" };
    }

    // Busca todos os pedidos com a data informada
    const orders = await Order.find({ createdAt: { $gte: new Date(date), $lt: new Date(date + "T23:59:59") } });
    if (orders.length === 0) {
        return { status: 404, message: "Nenhum pedido encontrado com a data especificada" };
    }

    return { status: 200, message: "Pedidos encontrados com sucesso", orders: orders };
}

export async function updateOrderService(orderId: string, updates: UpdateOrderDTO): Promise<OrderServiceResult> {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, { new: true });
    if (!updatedOrder) {
        return { status: 404, message: "Pedido não encontrado" };
    }

    return { status: 200, message: "Pedido atualizado com sucesso", order: updatedOrder };
}

export async function payOrderService(orderId: string): Promise<OrderServiceResult> {
    const paidOrder = await Order.findByIdAndUpdate(orderId, { status: "paid" }, { new: true });
    if (!paidOrder) {
        return { status: 404, message: "Pedido não encontrado" };
    }

    return { status: 200, message: "Pedido pago com sucesso", order: paidOrder };
}

export async function shipOrderService(orderId: string): Promise<OrderServiceResult> {
    const shippedOrder = await Order.findByIdAndUpdate(orderId, { status: "shipped" }, { new: true });
    if (!shippedOrder) {
        return { status: 404, message: "Pedido não encontrado" };
    }

    return { status: 200, message: "Pedido enviado com sucesso", order: shippedOrder };
}

export async function cancelOrderService(orderId: string, user: { id: string; role: string }): Promise<OrderServiceResult> {
    // Primeiro busca o pedido para validar permissões
    const order = await Order.findById(orderId);
    if (!order) {
        return { status: 404, message: "Pedido não encontrado" };
    }

    if (user.role !== "admin" && order.userId.toString() !== user.id) {
        return { status: 403, message: "Acesso negado" };
    }

    // Atualiza o status diretamente
    const cancelledOrder = await Order.findByIdAndUpdate(orderId, { status: "cancelled" }, { new: true });
    return { status: 200, message: "Pedido cancelado com sucesso", order: cancelledOrder };
}

export async function deleteOrderService(orderId: string): Promise<OrderServiceResult> {
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
        return { status: 404, message: "Pedido não encontrado" };
    }

    return { status: 200, message: "Pedido deletado com sucesso" };
}
