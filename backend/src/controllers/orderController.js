import Order from "../models/Order.js";

// Criar um novo pedido
export const createOrder = async (req, res) => {
    try {
        const order = new Order(req.body);
        const savedOrder = await order.save();
        res.status(201).json({ message: "Pedido criado com sucesso", order: savedOrder });
    } catch (error) {
        res.status(400).json({ message: "Erro ao criar pedido", error: error.message });
    }
};

// Listar todos os pedidos
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate("userId", "username").populate("items.productId", "name price");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
    }
};

// Obter um pedido por ID
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("userId", "username")
            .populate("products.product", "name price");

        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar pedido", error: error.message });
    }
};

// Atualizar um pedido
export const updateOrder = async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: "Erro ao atualizar pedido", error: error.message });
    }
};

// Deletar um pedido
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
