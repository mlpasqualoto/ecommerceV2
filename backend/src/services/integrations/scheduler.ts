import cron from "node-cron";
import { syncOlistShopeeOrders } from "./olistSync";

export function startSchedulers() {
  // Executa a cada 2 minutos
  cron.schedule("*/2 * * * *", async () => {
    try {
      // Pega a data atual no fuso de São Paulo
      const now = new Date();
      const currentDateBr = now.toLocaleDateString("pt-BR", { 
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }); // Retorna: "07/12/2024"

      console.log("⏱️ Iniciando sincronização da Olist...", currentDateBr);
      
      // Usa a data atual para sincronizar
      await syncOlistShopeeOrders(currentDateBr, currentDateBr, "");
      
      console.log("✅ Sincronização da Olist finalizada", currentDateBr);
    } catch (error) {
      console.error("❌ Erro na sincronização da Olist:", error);
    }
  });
}