import { Request, Response, NextFunction } from 'express';
import { errorHandler } from "../utils/errorHandler";

export function errorMiddleware(error: any, req: Request, res: Response, next: NextFunction): void {
    const method = req.method;
    const url = req.originalUrl;

    const { statusCode, errorMessage } = errorHandler(error, method, url);
    
    res.status(statusCode).json({success: false, status: statusCode, message: errorMessage})
}
