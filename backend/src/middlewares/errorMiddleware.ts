import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(error: any, req: Request, res: Response, next: NextFunction): void {
    console.error("Erro capturado: ", error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Erro interno do servidor."

    res.status(statusCode).json({success: false, status: statusCode, message: errorMessage})
}
