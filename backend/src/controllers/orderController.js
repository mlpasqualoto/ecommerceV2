import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

// Criar um novo pedido (user)
export const createOrder = async (req, res) => {
    try {
        // Pega o ID do usuário autenticado (via token)
        const userId = req.user.id;

        // Busca o usuário no banco para pegar o userName
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        // Monta os items preenchendo name e price do produto
        const items = await Promise.all(
            req.body.items.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Produto com ID ${item.productId} não encontrado`);
                }
                return {
                    productId: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.price
                };
            })
        );

        // Calcula o total
        const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Cria e salva o pedido
        const order = new Order({
            userId: user._id,
            userName: user.userName, // salva no banco também
            items,
            totalAmount,
            status: "pending"
        });

        const savedOrder = await order.save();

        res.status(201).json({
            message: "Pedido criado com sucesso",
            order: savedOrder
        });
    } catch (error) {
        res.status(400).json({ message: "Erro ao criar pedido", error: error.message });
    }
};

// Listar todos os pedidos do usuário (user)
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id });
        res.json({ message: "Pedidos encontrados com sucesso", orders: orders });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
    }
};

// Obter um pedido por ID (admin ou user)
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        // Se não for admin e o pedido não for do usuário logado, bloqueia
        if (req.user.role !== "admin" && order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Acesso negado" });
        }

        res.json({ message: "Pedido encontrado com sucesso", order: order });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar pedido", error: error.message });
    }
};

// Obter pedidos pelo status (user)
export const getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const allowedStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Status inválido" });
        }

        const orders = await Order.find({ status, userId: req.user.id });
        if (orders.length === 0) {
            return res.status(404).json({ message: "Nenhum pedido encontrado com o status especificado" });
        }

        res.json({ message: "Pedidos encontrados com sucesso", orders: orders });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
    }
};

// Obter pedidos por status (somente admin - todos os pedidos)
export const getAllOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const allowedStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Status inválido" });
        }

        // Busca todos os pedidos com o status informado
        const orders = await Order.find({ status });
        if (orders.length === 0) {
            return res.status(404).json({ message: "Nenhum pedido encontrado com o status especificado" });
        }

        res.json({ message: "Pedidos encontrados com sucesso", orders });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
    }
};

// Atualizar um pedido (somente admin)
export const updateOrder = async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json({ message: "Pedido atualizado com sucesso", order: updatedOrder });
    } catch (error) {
        res.status(400).json({ message: "Erro ao atualizar pedido", error: error.message });
    }
};

// Pagar um pedido (somente admin)
export const payOrder = async (req, res) => {
    try {
        const paidOrder = await Order.findByIdAndUpdate(req.params.id, { status: "paid" }, { new: true });

        if (!paidOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json({ message: "Pedido pago com sucesso", order: paidOrder });
    } catch (error) {
        res.status(400).json({ message: "Erro ao pagar pedido", error: error.message });
    }
};

// Cancelar um pedido (admin ou user)
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        if (req.user.role !== "admin" && order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Acesso negado" });
        }

        order.status = "cancelled";
        await order.save();

        res.json({ message: "Pedido cancelado com sucesso", order: order });
    } catch (error) {
        res.status(400).json({ message: "Erro ao cancelar pedido", error: error.message });
    }
};

// Deletar um pedido (somente admin)
export const deleteOrder = async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);

        if (!deletedOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json({ message: "Pedido deletado com sucesso" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar pedido", error: error.message });
    }
};
