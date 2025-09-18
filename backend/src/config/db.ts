import mongoose from "mongoose";
import "../models/User";
import "../models/Order";
import "../models/Product";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ Conectado ao MongoDB com sucesso");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1); // Encerra o processo se a conexão falhar
  }
}

export default connectDB;
