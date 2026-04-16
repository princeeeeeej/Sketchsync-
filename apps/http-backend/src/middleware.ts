import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';

export interface AuthRequest extends Request {
    userId?: string;
}

export const middleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.headers["authorization"];
    if (!token) {
        res.status(403).json({ message: "Unauthorized" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (e) {
        res.status(403).json({ message: "Unauthorized" });
        return;
    }
};