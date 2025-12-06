import axios from "axios";
import mongoose from "mongoose";
import Order from "../../models/Order";
import User from "../../models/User"; // assumindo que existe
import Product from "../../models/Product"; // assumindo que existe
import dotenv from "dotenv";
import logger from "../../utils/logger";
import { parseDataBr } from "../../utils/utils";

dotenv.config();

// ✅ Função auxiliar para pausar a execução (Sleep)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cache para evitar queries repetidas DURANTE A MESMA EXECUÇÃO
const productCache = new Map<string, { id: mongoose.Types.ObjectId; image: string }>();

// Garante que existe um usuário "Olist"
async function getOrCreateUser(userName: string): Promise<{ userId: mongoose.Types.ObjectId; userName: string }> {
  try {
    let user = await User.findOne({ userName: userName });
    
    if (!user) {
      logger.info("Criando usuário genérico Olist");
      user = await User.create({
        userName: userName,
        name: "Cliente Olist",
        email: "olist@sistema.com",
        // adicione outros campos obrigatórios do seu User model
      });
    }

    return { 
      userId: user._id as mongoose.Types.ObjectId,
      userName: user.userName 
    };
  } catch (error) {
    logger.error("Erro ao criar/buscar usuário Olist", { error });
    throw error;
  }
}

// Garante que existe um produto ou cria um genérico
async function getOrCreateProduct(codigo: string, descricao: string, valorUnitario: number, imagemUrl?: string): Promise<{ productId: mongoose.Types.ObjectId; productImage: string; productCost: number }> {
  try {
    // ⚠️ Sempre busca do banco (não usa cache para verificar produto)
    let product = await Product.findOne({ externalId: codigo });

    if (!product) {
      logger.info("Criando produto da Olist", { codigo, descricao });
      
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
        category: "Olist",
        stock: 0,
        status: "active",
        discount: 0
      });
      
      logger.info("Produto criado com sucesso", { codigo, productId: product._id });
    }

    // ⚠️ Sempre pega a imagem ATUAL do banco (reflete alterações manuais)
    const productImage = product.images?.[0]?.url || "";

    // Pega preço de custo atual
    const productCost = product.cost || 0;
    
    // Atualiza cache com dados frescos
    productCache.set(codigo, { id: product._id as mongoose.Types.ObjectId, image: productImage });
    
    return { productId: product._id as mongoose.Types.ObjectId, productImage, productCost };
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
    
    // ⚠️ LOG DETALHADO: Mostra a estrutura completa da resposta
    logger.debug("Resposta completa da API de detalhe", { 
      orderId, 
      fullResponse: JSON.stringify(resp.data, null, 2) 
    });
    
    if (resp.status === 200 && resp.data?.retorno?.pedido) {
      const pedido = resp.data.retorno.pedido;
      
      // ⚠️ LOG CRÍTICO: Mostra campos específicos
      logger.info("Estrutura do pedido detalhado", {
        orderId,
        temItens: !!pedido.itens,
        quantidadeItens: pedido.itens?.length || 0,
        temCliente: !!pedido.cliente,
        campos: Object.keys(pedido)
      });
      
      return pedido;
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
    // ⚠️ Limpa caches no início para refletir mudanças manuais
    productCache.clear();

    // variáveis de controle de Rate Limit
    // começa com 1 pois faremos a requisição de pesquisa logo abaixo
    let requestCount = 1; 
    const MAX_REQUESTS_PER_MINUTE = 55; // Limite seguro (o oficial é 60)
    const PAUSE_TIME_MS = 62000; // 62 segundos (1 min + 2s de margem)

    // Garante data atual em UTC-3
    const currentDateBr = parseDataBr(dataInicial);
    console.log("Data atual em UTC-3:", currentDateBr.toISOString());

    logger.info("Chamando endpoint pedidos.pesquisa.php", { dataInicial, dataFinal, situacao });
    
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
      // VERIFICAÇÃO DE RATE LIMIT ANTES DE CADA DETALHE
      if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        logger.warn(`⚠️ Limite de requisições aproximado (${requestCount}). Pausando por ${PAUSE_TIME_MS / 1000} segundos para liberar API...`);
        
        await sleep(PAUSE_TIME_MS);
        
        requestCount = 0; // Reseta o contador após a pausa
        logger.info("♻️ Retomando sincronização após pausa.");
      }

      const externalId = order.pedido.id ?? "";
      
      try {
        // ⚠️ CORREÇÃO: Sempre busca detalhes primeiro (independente se existe ou não)
        const detail = await fetchOlistOrderDetails(externalId);
        
        // incrementa contador após a requisição de detalhe
        requestCount++;

        if (!detail) {
          logger.warn("Não foi possível obter detalhes do pedido, pulando", { externalId });
          continue;
        }

        logger.info("Detalhe do pedido obtido", { externalId });

        //busca ou cria o usuário
        const olistUser = await getOrCreateUser(detail.ecommerce.nomeEcommerce || "olist_user");
        console.log("Olist User ID:", olistUser);

        // Verifica se o pedido já existe
        const existing = await Order.findOne({ externalId }).lean();

        if (!existing) {

          const endereco_entrega = detail.cliente ? `
            ${detail.cliente.endereco || ''}, 
            ${detail.cliente.numero || ''}, 
            ${detail.cliente.complemento || ''}, 
            bairro ${detail.cliente.bairro || ''}, 
            ${detail.cliente.cidade || ''}/${detail.cliente.uf || ''}, 
            CEP: ${detail.cliente.cep || ''}
          `.trim() : "";

          // Processa items criando/buscando produtos
          // ⚠️ CORREÇÃO: Itens vêm como array de objetos com propriedade "item"
          const items = [];
          for (const itemWrapper of detail.itens || []) {
            const i = itemWrapper.item; // ⚠️ Acessa o objeto item interno
            
            if (!i) {
              logger.warn("Item sem dados internos, pulando", { externalId, itemWrapper });
              continue;
            }
            
            // ⚠️ LOG DEBUG: Mostra o que está vindo da API
            logger.debug("Processando item do pedido", {
              externalId,
              codigo: i.codigo,
              descricao: i.descricao,
              quantidade: i.quantidade,
              valor_unitario: i.valor_unitario,
              id_produto: i.id_produto
            });
            
            // ⚠️ CORREÇÃO: Se código vazio, usa descricao como identificador único
            let productCode = i.codigo?.trim();
            if (!productCode) {
              // Gera código baseado na descrição para manter consistência
              productCode = `OLIST-${i.descricao?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'SEM-DESC'}-${i.id_produto || Date.now()}`;
            }
            
            const productIdImgCost = await getOrCreateProduct(
              productCode,
              i.descricao || "Produto sem descrição",
              i.valor_unitario ? Number(i.valor_unitario) : 0,
              i.imagem // a API Tiny pode não ter este campo
            );

            const itemProcessado = {
              productId: productIdImgCost.productId,
              name: i.descricao || "Produto sem descrição",
              quantity: i.quantidade ? Number(i.quantidade) : 1,
              originalPrice: i.valor_unitario ? Number(i.valor_unitario) : 0,
              price: i.valor_unitario ? Number(i.valor_unitario) : 0,
              cost: productIdImgCost.productCost || 0,
              discount: i.desconto ? Number(i.desconto) : 0,
              imageUrl: productIdImgCost.productImage || "https://via.placeholder.com/150",
            };
            
            // ⚠️ LOG DEBUG: Mostra o item processado
            logger.debug("Item processado", { externalId, itemProcessado });
            
            items.push(itemProcessado);
          }

          const totalCost = items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
          const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
          const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          
          // ⚠️ LOG IMPORTANTE: Mostra totais calculados
          logger.info("Totais calculados", { 
            externalId, 
            itemsCount: items.length,
            totalQuantity, 
            totalAmount 
          });

          const mappedOrder = {
            externalId,
            userId: olistUser.userId,
            userName: detail.nome || detail.cliente?.nome || "Cliente Olist",
            name: `Pedido Olist nº ${detail.numero ?? ''}, em nome de ${detail.cliente?.nome || detail.nome || "Cliente Olist"}, Ecommerce - ${olistUser.userName} - nº ${detail.numero_ecommerce ?? ''}`,
            shippingAddress: endereco_entrega,
            buyerPhone: detail.cliente?.fone ?? "",
            items,
            totalCost,
            totalAmount,
            paymentMethod: detail.meio_pagamento || "unknown",
            totalQuantity,
            status: mapStatus(detail.situacao ?? ""),
            source: olistUser.userName || "olist",
            createdAt: currentDateBr,
          };

          if (items.length === 0 || totalQuantity < 1) {
            logger.warn("Pedido sem items válidos, pulando criação", { externalId, itemsCount: items.length });
            continue;
          }

          await Order.create(mappedOrder);
          logger.info("Pedido criado com sucesso", { externalId, itemsCount: items.length });

        } else {

          const endereco_entrega = detail.cliente ? `
            ${detail.cliente.endereco || ''}, 
            ${detail.cliente.numero || ''}, 
            ${detail.cliente.complemento || ''}, 
            bairro ${detail.cliente.bairro || ''}, 
            ${detail.cliente.cidade || ''}/${detail.cliente.uf || ''}, 
            CEP: ${detail.cliente.cep || ''}
          `.trim() : "";

          // ⚠️ ATUALIZAÇÃO: processar items para criar/buscar produtos
          logger.info("Processando items do pedido para atualização", { 
            externalId, 
            itensRecebidos: detail.itens?.length || 0 
          });

          const items = [];
          for (const itemWrapper of detail.itens || []) {
            const i = itemWrapper.item;
            
            if (!i) {
              logger.warn("Item sem dados internos na atualização, pulando", { externalId, itemWrapper });
              continue;
            }
            
            logger.debug("Processando item para atualização", {
              externalId,
              codigo: i.codigo,
              descricao: i.descricao,
              quantidade: i.quantidade,
              valor_unitario: i.valor_unitario,
              id_produto: i.id_produto
            });
            
            let productCode = i.codigo?.trim();
            if (!productCode) {
              productCode = `OLIST-${i.descricao?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'SEM-DESC'}-${i.id_produto || Date.now()}`;
            }
            // ⚠️ AQUI: Chama getOrCreateProduct na atualização também
            const productIdImg = await getOrCreateProduct(
              productCode,
              i.descricao || "Produto sem descrição",
              i.valor_unitario ? Number(i.valor_unitario) : 0,
              i.imagem
            );

            const itemProcessado = {
              productId: productIdImg.productId,
              name: i.descricao || "Produto sem descrição",
              quantity: i.quantidade ? Number(i.quantidade) : 1,
              originalPrice: i.valor_unitario ? Number(i.valor_unitario) : 0,
              price: i.valor_unitario ? Number(i.valor_unitario) : 0,
              discount: i.desconto ? Number(i.desconto) : 0,
              imageUrl: productIdImg.productImage || "https://via.placeholder.com/150",
            };
            
            logger.debug("Item processado para atualização", { externalId, itemProcessado });
            
            items.push(itemProcessado);
          }

          const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
          const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          
          logger.info("Totais calculados para atualização", { 
            externalId, 
            itemsCount: items.length,
            totalQuantity, 
            totalAmount 
          });

          await Order.updateOne(
            { externalId },
            { 
              $set: {
                userId: olistUser.userId,
                userName: detail.nome || detail.cliente?.nome || "Cliente Olist",
                name: `Pedido Olist nº ${detail.numero ?? ''}, em nome de ${detail.cliente?.nome || detail.nome || "Cliente Olist"}, Ecommerce - ${olistUser.userName} - nº ${detail.numero_ecommerce ?? ''}`,
                shippingAddress: endereco_entrega,
                buyerPhone: detail.cliente?.fone ?? "",
                items,
                totalAmount,
                totalQuantity,
                status: mapStatus(detail.situacao ?? ""),
                source: olistUser.userName || "olist",
                createdAt: currentDateBr,
              }
            }
          );
          logger.info("Pedido atualizado com sucesso", { externalId, itemsCount: items.length });
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