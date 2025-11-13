import logger from "../utils/logger"

export function errorHandler(error: any, method?: string, url?: string) {
    console.error("Erro capturado: ", error);

    const statusCode = error?.statusCode || 500;
    const errorMessage = error?.message || "Erro interno do servidor.";

    const methodLabel = method ?? "UNKNOWN_METHOD";
    const urlLabel = url ?? "unknown_url";

    // gera log de erro
    logger.error(`${methodLabel} ${urlLabel} - ${errorMessage}`);
    
    // exibe no console também (apenas dev)
    if (process.env.NODE_ENV !== "production") {
        console.log(error);
    }

    return { success: false, statusCode, errorMessage };
}