import axios from "axios";
import mongoose from "mongoose";
import Order from "../../models/Order";
import User from "../../models/User"; // assumindo que existe
import Product from "../../models/Product"; // assumindo que existe
import dotenv from "dotenv";
import logger from "../../utils/logger";

dotenv.config();

// Cache para evitar queries repetidas
let olistUserCache: mongoose.Types.ObjectId | null = null;
const productCache = new Map<string, mongoose.Types.ObjectId>();

function parseOlistDateToISO(rawDate?: string): Date | null {
  if (!rawDate) return null;

  const ddmmyyyy = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    return new Date(year, month - 1, day, 0, 0, 0);
  }

  const d = new Date(rawDate);
  if (!Number.isNaN(d.getTime())) {
    return d;
  }

  return null;
}

// Garante que existe um usuário genérico "Olist"
async function getOrCreateOlistUser(): Promise<mongoose.Types.ObjectId> {
  if (olistUserCache) return olistUserCache;

  try {
    let user = await User.findOne({ email: "olist@sistema.com" });
    
    if (!user) {
      logger.info("Criando usuário genérico Olist");
      user = await User.create({
        name: "Cliente Olist",
        email: "olist@sistema.com",
        // adicione outros campos obrigatórios do seu User model
      });
    }

    olistUserCache = user._id as mongoose.Types.ObjectId;
    return olistUserCache;
  } catch (error) {
    logger.error("Erro ao criar/buscar usuário Olist", { error });
    throw error;
  }
}

// Garante que existe um produto ou cria um genérico
async function getOrCreateProduct(codigo: string, descricao: string, valorUnitario: number, imagemUrl?: string): Promise<mongoose.Types.ObjectId> {
  // Verifica cache primeiro
  if (productCache.has(codigo)) {
    return productCache.get(codigo)!;
  }

  try {
    // Busca produto existente pelo código externo
    let product = await Product.findOne({ externalId: codigo });

    if (!product) {
      logger.info("Criando produto da Olist", { codigo, descricao });
      
      // Monta array de images conforme schema (IProductImage)
      const images = [];
      if (imagemUrl) {
        images.push({
          public_id: `olist_${codigo}`,
          url: imagemUrl,
          width: 500,
          height: 500,
          format: "jpg",
          bytes: 0
        });
      }
      
      product = await Product.create({
        externalId: codigo,
        name: descricao || `Produto Olist ${codigo}`,
        price: valorUnitario || 0,
        images: images,
        description: descricao || "",
        category: "Olist", // categoria padrão para produtos da Olist
        stock: 0,
        status: "active",
        discount: 0
      });
      
      logger.info("Produto criado com sucesso", { codigo, productId: product._id });
    }

    productCache.set(codigo, product._id as mongoose.Types.ObjectId);
    return product._id as mongoose.Types.ObjectId;
  } catch (error) {
    logger.error("Erro ao criar/buscar produto", { codigo, descricao, error });
    throw error;
  }
}

async function fetchOlistOrderDetails(orderId: string) {
  try {
    logger.info("Buscando detalhe do pedido Olist", { orderId });
    const data = new URLSearchParams({
      token: process.env.OLIST_API_TOKEN || "",
      formato: "JSON",
      id: orderId,
    });

    const resp = await axios.post("https://api.tiny.com.br/api2/pedido.obter.php", data.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    });

    logger.info("Resposta detalhe pedido recebida", { orderId, status: resp.status });
    if (resp.status === 200 && resp.data?.retorno?.pedido) {
      return resp.data.retorno.pedido;
    }

    logger.warn("Detalhe de pedido não retornado", { orderId, status: resp.status });
    return null;
  } catch (err) {
    logger.error("Erro ao buscar detalhe do pedido Olist", { orderId, error: err });
    return null;
  }
}

export async function syncOlistShopeeOrders(dataInicial: string, dataFinal: string, situacao: string) {
  try {
    logger.info("Chamando endpoint pedidos.pesquisa.php", { dataInicial, dataFinal, situacao });
    
    // Garante usuário genérico antes de processar pedidos
    const olistUserId = await getOrCreateOlistUser();

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
      timeout: 15000,
    });

    logger.info("Resposta pedidos.pesquisa.php recebida", { status: response.status });
    if (response.status !== 200) {
      const error = new Error(`Erro ao buscar pedidos da Olist: ${response.statusText}`);
      (error as any).statusCode = response.status;
      logger.error("Erro buscando pedidos Olist", { status: response.status, statusText: response.statusText });
      throw error;
    }

    logger.info("Pedido obtido com sucesso", { endpoint: "pedidos.pesquisa.php" });
    logger.debug("Resposta Olist (debug)", { data: response.data });

    const orders = response.data.retorno?.pedidos || [];
    logger.info("Número de pedidos retornados", { count: orders.length });

    for (const order of orders) {
      const externalId = order.pedido.id ?? "";
      
      try {
        const existing = await Order.findOne({ externalId }).lean();

        if (!existing) {
          const detail = await fetchOlistOrderDetails(externalId);
          
          if (!detail) {
            logger.warn("Não foi possível obter detalhes do pedido, pulando criação", { externalId });
            continue;
          }

          logger.info("Detalhe do pedido obtido", { externalId });

          const rawDate = detail.data_pedido ?? null;
          const createdAtDateObj = parseOlistDateToISO(rawDate);

          const endereco_entrega = detail.cliente ? `
            ${detail.cliente.endereco || ''}, 
            ${detail.cliente.numero || ''}, 
            ${detail.cliente.complemento || ''}, 
            ${detail.cliente.bairro || ''}, 
            ${detail.cliente.cidade || ''}/${detail.cliente.uf || ''}, 
            CEP: ${detail.cliente.cep || ''}
          `.trim() : "";

          // Processa items criando/buscando produtos
          const items = [];
          for (const i of detail.itens || []) {
            const productId = await getOrCreateProduct(
              i.codigo || `OLIST-${Date.now()}`,
              i.descricao || "Produto sem descrição",
              i.valor_unitario ? Number(i.valor_unitario) : 0,
              i.imagem
            );

            items.push({
              productId,
              name: i.descricao || "Produto sem descrição",
              quantity: i.quantidade ? Number(i.quantidade) : 1,
              originalPrice: i.valor_unitario ? Number(i.valor_unitario) : 0,
              price: i.valor_unitario ? Number(i.valor_unitario) : 0,
              discount: i.desconto ? Number(i.desconto) : 0,
              imageUrl: i.imagem || "https://via.placeholder.com/150",
            });
          }

          const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
          const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

          const mappedOrder = {
            externalId,
            userId: olistUserId,
            userName: detail.nome || detail.cliente?.nome || "Cliente Olist",
            name: `Pedido Olist nº ${detail.numero ?? ''}, nº Ecommerce ${detail.numero_ecommerce ?? ''}`,
            shippingAddress: endereco_entrega,
            buyerPhone: detail.cliente?.fone ?? "",
            items,
            totalAmount,
            totalQuantity,
            status: mapStatus(detail.situacao ?? ""),
            source: "olist" as const,
            createdAt: createdAtDateObj ?? undefined,
          };

          if (items.length === 0 || totalQuantity < 1) {
            logger.warn("Pedido sem items válidos, pulando criação", { externalId, itemsCount: items.length });
            continue;
          }

          await Order.create(mappedOrder);
          logger.info("Pedido criado com sucesso", { externalId, itemsCount: items.length });

        } else {
          const detail = await fetchOlistOrderDetails(externalId);
          
          if (!detail) {
            logger.warn("Não foi possível obter detalhes para atualização", { externalId });
            continue;
          }

          const rawDate = detail.data_pedido ?? null;
          const createdAtDateObj = parseOlistDateToISO(rawDate);

          const endereco_entrega = detail.cliente ? `
            ${detail.cliente.endereco || ''}, 
            ${detail.cliente.numero || ''}, 
            ${detail.cliente.complemento || ''}, 
            ${detail.cliente.bairro || ''}, 
            ${detail.cliente.cidade || ''}/${detail.cliente.uf || ''}, 
            CEP: ${detail.cliente.cep || ''}
          `.trim() : "";

          const items = [];
          for (const i of detail.itens || []) {
            const productId = await getOrCreateProduct(
              i.codigo || `OLIST-${Date.now()}`,
              i.descricao || "Produto sem descrição",
              i.valor_unitario ? Number(i.valor_unitario) : 0,
              i.imagem
            );

            items.push({
              productId,
              name: i.descricao || "Produto sem descrição",
              quantity: i.quantidade ? Number(i.quantidade) : 1,
              originalPrice: i.valor_unitario ? Number(i.valor_unitario) : 0,
              price: i.valor_unitario ? Number(i.valor_unitario) : 0,
              discount: i.desconto ? Number(i.desconto) : 0,
              imageUrl: i.imagem || "https://via.placeholder.com/150",
            });
          }

          const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
          const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

          await Order.updateOne(
            { externalId },
            { 
              $set: {
                userId: olistUserId,
                userName: detail.nome || detail.cliente?.nome || "Cliente Olist",
                name: `Pedido Olist nº ${detail.numero ?? ''}, nº Ecommerce ${detail.numero_ecommerce ?? ''}`,
                shippingAddress: endereco_entrega,
                buyerPhone: detail.cliente?.fone ?? "",
                items,
                totalAmount,
                totalQuantity,
                status: mapStatus(detail.situacao ?? ""),
                createdAt: createdAtDateObj ?? undefined,
              }
            }
          );
          logger.info("Pedido atualizado com sucesso", { externalId });
        }
      } catch (error) {
        logger.error("Erro salvando/atualizando pedido Olist", { externalId, error });
      }
    }

    logger.info("Pedidos sincronizados da Olist", { count: orders.length });
  } catch (error) {
    logger.error("Erro ao sincronizar pedidos da Olist", { error });
    throw error;
  }
}

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