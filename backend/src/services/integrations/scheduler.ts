import cron from "node-cron";
import { syncOlistShopeeOrders } from "./olistSync";

export function startSchedulers() {
  // Executa a cada 2 minutos
  cron.schedule("*/2 * * * *", async () => {
    console.log("⏱️ Iniciando sincronização da Olist...");
    await syncOlistShopeeOrders("2023-01-01", "2024-12-31", "todos");
  });
}