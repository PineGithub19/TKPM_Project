import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
    user?: { userId?: string; username?: string; role?: string };
}

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            console.log("No token found 1");
            return;
        }

        const decoded = jwt.verify(token, SECRET_KEY) as { userId: string; username: string; role: string };
        req.user = decoded;
        console.log(req.user);
        next();
    } catch (error) {
        console.log("No token found");
        return;
    }
};
