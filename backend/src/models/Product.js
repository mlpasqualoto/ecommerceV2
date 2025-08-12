import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock', 'archived', 'draft'],
        default: 'active'
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    versionKey: false, // remove o campo "__v" do documento
    timestamps: true // cria automaticamente createdAt e updatedAt
});

export default mongoose.model("Product", productSchema);
