import mongoose, { Document, Schema } from "mongoose";

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    originalPrice: number;
    discount: number;
    price: number;
    imageUrl: string;
}

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    userName: string;
    name: string;
    items: IOrderItem[];
    totalAmount: number;
    totalQuantity: number;
    status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
    createdAt?: Date;
    updatedAt?: Date;
}

const orderSchema = new Schema<IOrder>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            name: {
                type: String,
                required: true,
                trim: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            originalPrice: {
                type: Number,
                required: true,
                min: 0
            },
            discount: {
                type: Number,
                required: true,
                min: 0
            },
            price: {
                type: Number,
                required: true,
                min: 0
            },
            imageUrl: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    totalQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
        default: "pending"
    }
}, {
    versionKey: false, // remove o campo "__v" do documento
    timestamps: true // cria automaticamente createdAt e updatedAt
});

export default mongoose.model<IOrder>("Order", orderSchema);
