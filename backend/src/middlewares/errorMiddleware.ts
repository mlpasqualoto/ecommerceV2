import { Request, Response, NextFunction } from 'express';
const logger = require("./src/utils/logger");

export function errorMiddleware(error: any, req: Request, res: Response, next: NextFunction): void {
    console.error("Erro capturado: ", error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Erro interno do servidor.";

    // gera log de erro
    logger.error(`${req.method} ${req.originalUrl} - ${errorMessage}`);
    
    // exibe no console também (apenas dev)
    if (process.env.NODE_ENV !== "production") {
        console.log(error);
    }

    res.status(statusCode).json({success: false, status: statusCode, message: errorMessage})
}
