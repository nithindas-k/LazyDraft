import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Check Passport session first
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    // 2. Fallback: Check JWT Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback_secret") as { id: string; email: string };
            const user = await User.findById(decoded.id);
            if (user) {
                (req as any).user = user;
                return next();
            }
        } catch (err) {
            // Token invalid or expired — fall through to 401
        }
    }

    res.status(401).json({ success: false, message: "Unauthorized: Please log in first." });
};
