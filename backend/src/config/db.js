import mongoose from "mongoose";
import "../models/User.js";
import "../models/Order.js";
import "../models/Product.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado ao MongoDB com sucesso");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1); // Encerra o processo se a conexão falhar
  }
}

export default connectDB;
