import cron from "node-cron";
import { syncOlistShopeeOrders } from "./olistSync";

export function startSchedulers() {
  // Executa a cada 2 minutos
  cron.schedule("*/2 * * * *", async () => {
    console.log("⏱️ Iniciando sincronização da Olist...", new Date().toISOString());
    try {
      const dataInicial = "05/12/2025";
      const dataFinal = "05/12/2025";
      await syncOlistShopeeOrders(dataInicial, dataFinal, "");
      console.log("✅ Sincronização da Olist finalizada", new Date().toISOString());
    } catch (error) {
      console.error("❌ Erro na sincronização da Olist:", error);
    }
  });
}