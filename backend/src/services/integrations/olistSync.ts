import axios from "axios";
import Order from "../../models/Order";
import dotenv from "dotenv";
import { errorHandler } from "../../utils/errorHandler";
import logger from "../../utils/logger";

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

    if (response.status !== 200) {
      const error = new Error(`Erro ao buscar pedidos da Olist: ${response.statusText}`);
      (error as any).statusCode = response.status;
      return errorHandler(error, "POST", "/api2/pedidos.pesquisa.php");
    }

    logger.info("Pedido obtido com sucesso", { endpoint: "pedidos.pesquisa.php", rateLimit: response.headers["x-limit-api"] });
    logger.debug("Resposta Olist (debug)", { data: response.data }); // só aparece se LOG_LEVEL=debug
    
    const orders = response.data.retorno.pedidos || [];

    for (const order of orders) {
      // tente extrair um id de usuário válido vindo da Olist (ajuste as chaves conforme payload real)
      const rawUserId = order.pedido.id_usuario ?? order.pedido.id_cliente ?? null;
      // se não houver um id válido, OMITIMOS userId para evitar cast para ObjectId inválido
      const maybeUserId = rawUserId ? String(rawUserId) : undefined;

      const mappedOrder: any = {
        externalId: order.pedido.id ?? "",
        ...(maybeUserId ? { userId: maybeUserId } : {}),
        userName: order.pedido.nome ?? "",
        name: `Pedido Olist nº ${order.pedido.numero ?? ''}, nº Ecommerce ${order.pedido.numero_ecommerce ?? ''}`,
        items: (order.pedido.itens ?? []).map((i: any) => ({
          productId: i.id_produto ?? null,
          name: i.nome ?? null,
          quantity: i.quantidade ? Number(i.quantidade) : null,
          originalPrice: i.preco_unitario ? Number(i.preco_unitario) : null,
          discount: i.desconto ? Number(i.desconto) : 0,
          price: i.preco_unitario ? Number(i.preco_unitario) : null,
          imageUrl: "",
        })),
        totalAmount: order.pedido.valor ? Number(order.pedido.valor) : 0,
        totalQuantity: null,
        status: mapStatus(order.pedido.situacao ?? ""),
        source: "olist",
      };

      try {
        await Order.updateOne(
          { externalId: mappedOrder.externalId },
          { $set: mappedOrder },
          { upsert: true }
        );
        logger.info("Pedido salvo/atualizado", { externalId: mappedOrder.externalId });
      } catch (error) {
        logger.error("Erro salvando pedido Olist", { externalId: mappedOrder.externalId, error: error });
      }
    }

    logger.info("Pedidos sincronizados da Olist", { count: orders.length });
  } catch (error) {
    logger.error("Erro ao sincronizar pedidos da Olist", { error });
    return errorHandler(error, "POST", "/api2/pedidos.pesquisa.php");
  }
}

// Função auxiliar para traduzir status da Olist → seu padrão interno
function mapStatus(olistStatus: string): string {
  switch (olistStatus.toLowerCase()) {
    case "Em aberto":
    case "Não entregue":
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