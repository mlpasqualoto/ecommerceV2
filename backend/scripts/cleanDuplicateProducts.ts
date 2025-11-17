import Product from "../src/models/Product";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../src/config/db";

dotenv.config();

async function cleanDuplicateProducts() {
  await connectDB();
  
  // Busca todos produtos da Olist agrupados por externalId
  const products = await Product.find({ 
    category: "Olist" 
  }).sort({ createdAt: 1 }); // ordena pelo mais antigo primeiro
  
  const seen = new Set<string>();
  const toDelete: mongoose.Types.ObjectId[] = [];
  
  for (const product of products) {
    if (seen.has(product.externalId as string)) {
      // Duplicado! Marca para deletar
      toDelete.push(product._id as mongoose.Types.ObjectId);
      console.log(`Duplicado encontrado: ${product.externalId} - ${product.name}`);
    } else {
      // Primeiro encontrado, mantém
      seen.add(product.externalId as string);
    }
  }
  
  console.log(`\nTotal de produtos duplicados: ${toDelete.length}`);
  console.log(`Produtos únicos mantidos: ${seen.size}`);
  
  if (toDelete.length > 0) {
    const result = await Product.deleteMany({ 
      _id: { $in: toDelete } 
    });
    console.log(`\n✅ ${result.deletedCount} produtos duplicados removidos!`);
  }
  
  await mongoose.disconnect();
}

cleanDuplicateProducts().catch(console.error);