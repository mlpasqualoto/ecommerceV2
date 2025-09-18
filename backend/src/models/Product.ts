import mongoose, { Document, Schema } from "mongoose";

export interface IProductImage {
    public_id: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
}

export interface IProduct extends Document {
    name: string;
    price: number;
    images: IProductImage[];
    description?: string;
    category: string;
    stock: number;
    status: "active" | "inactive" | "out_of_stock" | "archived" | "draft";
    discount: number;
    createdAt?: Date;
    updatedAt?: Date;
}


const imageSchema = new Schema<IProductImage>({
    public_id: String,
    url: String,
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
}, { _id: false });


const productSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    images: [imageSchema],
    description: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ["active", "inactive", "out_of_stock", "archived", "draft"],
        default: "active",
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
}, {
    versionKey: false,
    timestamps: true,
});

export default mongoose.model<IProduct>("Product", productSchema);
