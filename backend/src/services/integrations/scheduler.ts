import cron from "node-cron";
import { syncOlistShopeeOrders } from "./olistSync";

export function startSchedulers() {
  // Executa a cada 2 minutos
  cron.schedule("*/2 * * * *", async () => {
    console.log("⏱️ Iniciando sincronização da Olist...", new Date().toISOString());
    try {
      // Pega a data atual no fuso de São Paulo
      const now = new Date();
      const currentDateBr = now.toLocaleDateString("pt-BR", { 
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }); // Retorna: "07/12/2024"
      
      // Usa a data atual para sincronizar
      await syncOlistShopeeOrders(currentDateBr, currentDateBr, "");
      
      console.log("✅ Sincronização da Olist finalizada", new Date().toISOString());
    } catch (error) {
      console.error("❌ Erro na sincronização da Olist:", error);
    }
  });
}