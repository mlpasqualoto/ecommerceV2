import { Types, Document } from "mongoose"

export interface IOrderItem {
    productId: Types.ObjectId;
    name: string;
    quantity: number;
    originalPrice: number;
    discount: number;
    cost?: number;
    price: number;
    imageUrl: string;
}

export interface IOrder extends Document {
    externalId: string;
    userId: Types.ObjectId;
    userName: string;
    name: string;
    shippingAddress: string;
    buyerPhone: string;
    items: IOrderItem[];
    totalCost?: number;
    totalAmount: number;
    paymentMethod?: string;
    totalQuantity: number;
    status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
    source: "olist" | "ecommerce";
    createdAt?: Date;
    updatedAt?: Date;
}

export interface OrderServiceResult {
    status: number;
    message: string;
    order?: any;
    orders?: any[];
}

export interface UpdateOrderDTO {
    productId: string;
    quantity: number;
    status: string;
    totalAmount: number;
}

export interface CreateOrderDTO {
    productId: string;
    quantity: number;
}
