import Product from "../src/models/Product";
import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";
import connectDB from "../src/config/db";

// Carrega variáveis de ambiente
dotenv.config();

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function deleteAllOlistProducts() {
  try {
    console.log("🔌 Conectando ao MongoDB...");
    await connectDB();
    console.log("✅ Conectado com sucesso!\n");
    
    // Busca produtos da Olist
    console.log("🔍 Buscando produtos da categoria Olist...");
    const products = await Product.find({ category: "Olist" });
    
    console.log(`\n📦 Produtos encontrados: ${products.length}`);
    
    if (products.length === 0) {
      console.log("\n✅ Nenhum produto da Olist encontrado. Nada a fazer!");
      return;
    }
    
    // Mostra alguns exemplos
    console.log("\n📋 Exemplos de produtos que serão deletados:");
    products.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.externalId})`);
    });
    if (products.length > 5) {
      console.log(`   ... e mais ${products.length - 5} produtos`);
    }
    
    // Confirmação de segurança
    console.log("\n⚠️  ATENÇÃO: Esta ação é IRREVERSÍVEL!");
    console.log(`⚠️  Serão deletados ${products.length} produtos da categoria Olist`);
    
    const answer = await askQuestion("\n❓ Tem certeza que deseja continuar? (digite 'SIM' para confirmar): ");
    
    if (answer.toUpperCase() !== "SIM") {
      console.log("\n❌ Operação cancelada pelo usuário.");
      return;
    }
    
    // Segunda confirmação
    const finalAnswer = await askQuestion("\n❓ Confirmação final. Digite 'DELETAR' para prosseguir: ");
    
    if (finalAnswer.toUpperCase() !== "DELETAR") {
      console.log("\n❌ Operação cancelada pelo usuário.");
      return;
    }
    
    // Deleta os produtos
    console.log("\n🗑️  Deletando produtos...");
    const result = await Product.deleteMany({ category: "Olist" });
    
    console.log(`\n✅ ${result.deletedCount} produtos deletados com sucesso!`);
    console.log("\n💡 Próximo passo: Execute a sincronização da Olist para recriar os produtos corretos:");
    console.log("   npm run sync:olist");
    
  } catch (error) {
    console.error("\n❌ Erro ao executar script:", error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado do MongoDB");
  }
}

// Executa o script
deleteAllOlistProducts()
  .then(() => {
    console.log("\n✅ Script finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });