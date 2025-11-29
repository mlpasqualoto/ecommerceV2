import cron from "node-cron";
import { syncOlistShopeeOrders } from "./olistSync";

export function startSchedulers() {
  // Executa a cada 2 minutos
  cron.schedule("*/2 * * * *", async () => {
    console.log("⏱️ Iniciando sincronização da Olist...", new Date().toISOString());
    try {
      // ajuste o formato das datas conforme a API (ex: "2025-11-15" se a API esperar YYYY-MM-DD)
      const dataInicial = "29/11/2025";
      const dataFinal = "29/11/2025";
      await syncOlistShopeeOrders(dataInicial, dataFinal, "");
      console.log("✅ Sincronização da Olist finalizada", new Date().toISOString());
    } catch (error) {
      console.error("❌ Erro na sincronização da Olist:", error);
    }
  });
}