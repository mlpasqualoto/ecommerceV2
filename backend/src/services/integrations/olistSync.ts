import axios from "axios";
import Order from "../../models/Order";
import dotenv from "dotenv";

dotenv.config();

export async function syncOlistShopeeOrders(dataInicial: string, dataFinal: string, situacao: string) {
  try {
    const data = new URLSearchParams({
      token: process.env.OLIST_API_TOKEN || "",
      formato: "JSON",
      dataInicial: dataInicial,
      dataFinal: dataFinal,
      situacao: situacao,
    });

    const response = await axios.post("https://api.tiny.com.br/api2/pedidos.pesquisa.php", data.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("📦 Pedido obtido com sucesso:");
    console.log(response.headers["x-limit-api"]);
    console.log(JSON.stringify(response.data, null, 2));

    const orders = response.data.retorno.pedidos || [];

    for (const order of orders) {
      // Mapeamento para o formato do seu schema atual
      const mappedOrder = {
        userId: "INTEGRAÇÃO OLIST",
        userName: order.pedido.nome,
        name: `Pedido Olist Id ${order.pedido.id}, nº Olist ${order.pedido.numero}, nº Ecommerce ${order.pedido.numero_ecommerce}`,
        items: {
          productId: null,
          name: null,
          quantity: null,
          originalPrice: null,
          discount: 0,
          price: null,
          imageUrl: "",
        },
        totalAmount: order.pedido.valor,
        totalQuantity: null,
        status: mapStatus(order.pedido.situacao),
      };

      // Evita duplicar pedidos
      await Order.updateOne(
        { name: `Pedido Olist Id ${order.pedido.id}, nº Olist ${order.pedido.numero}, nº Ecommerce ${order.pedido.numero_ecommerce}` },
        { $set: mappedOrder },
        { upsert: true }
      );
    }

    console.log(`✅ ${orders.length} pedidos sincronizados da Olist`);
  } catch (error) {
    console.error("❌ Erro ao sincronizar pedidos da Olist:", error);
  }
}

// Função auxiliar para traduzir status da Olist → seu padrão interno
function mapStatus(olistStatus: string): string {
  switch (olistStatus.toLowerCase()) {
    case "Em aberto":
    case "Não Entregue":
      return "pending";
    case "Aprovado":
    case "Preparando envio":
    case "Faturado (atendido)":
    case "Pronto para envio":
      return "paid";
    case "Enviado":
      return "shipped";
    case "Entregue":
      return "delivered";
    case "Cancelado":
      return "cancelled";
    default:
      return "pending";
  }
}