import axios from "axios";
import Order from "../../models/Order";
import dotenv from "dotenv";
import logger from "../../utils/logger";

dotenv.config();

function parseOlistDateToISO(rawDate?: string): string | null {
  if (!rawDate) return null;

  // Formato DD/MM/YYYY -> criar um instante seguro (meio-dia UTC) para evitar rollovers
  const ddmmyyyy = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    // usar 12:00 UTC (meio-dia) garante que a data não "ande" para o dia anterior/próximo em diferentes timezones
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
  }

  // Tenta interpretar como ISO/Date com offset se vier neste formato
  const d = new Date(rawDate);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString();
  }

  return null;
}

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
      logger.error("Erro buscando pedidos Olist", { status: response.status, statusText: response.statusText });
      throw error; // propagar para o caller decidir o tratamento
    }

    logger.info("Pedido obtido com sucesso", { endpoint: "pedidos.pesquisa.php", rateLimit: response.headers["x-limit-api"] });
    logger.debug("Resposta Olist (debug)", { data: response.data }); // só aparece se LOG_LEVEL=debug

    const orders = response.data.retorno.pedidos || [];

    for (const order of orders) {
      const rawUserId = order.pedido.id_usuario ?? order.pedido.id_cliente ?? null;
      const maybeUserId = rawUserId ? String(rawUserId) : undefined;

      // parsear data do pedido (p.ex. data_pedido = "01/01/2013")
      const rawDate = order.pedido.data_pedido ?? order.pedido.data_criacao ?? order.pedido.data ?? null;
      const createdAtIso = parseOlistDateToISO(rawDate);

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
        createdAt: createdAtIso,          // ISO seguro (ou null)
        createdAtRaw: rawDate ?? null,    // mantém original para auditoria
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
    throw error; // propagar para o scheduler/handler
  }
}

// Função auxiliar para traduzir status da Olist → seu padrão interno
function mapStatus(olistStatus: string): string {
  switch (olistStatus.toLowerCase()) {
    case "em aberto":
    case "não entregue":
      return "pending";
    case "aprovado":
    case "preparando envio":
    case "faturado (atendido)":
    case "pronto para envio":
      return "paid";
    case "enviado":
      return "shipped";
    case "entregue":
      return "delivered";
    case "cancelado":
      return "cancelled";
    default:
      return "pending";
  }
}