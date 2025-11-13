import cron from "node-cron";
import { syncOlistShopeeOrders } from "./olistSync";

export function startSchedulers() {
  // Executa a cada 2 minutos
  cron.schedule("*/2 * * * *", async () => {
    console.log("⏱️ Iniciando sincronização da Olist...");
    await syncOlistShopeeOrders("13/11/2025", "13/11/2025", "");
  });
}