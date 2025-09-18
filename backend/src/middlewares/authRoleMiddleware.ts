import express from "express";

export const authorizeRole = (requiredRole: string) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Não autenticado" });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: "Acesso negado" });
        }

        next();
    };
};
