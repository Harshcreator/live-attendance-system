import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user";

export interface JwtPayload {
    userId: string;
    role: "teacher" | "student";
}

export interface AuthRequest extends Request {
    user?: IUser;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            res.status(500).json({ message: "JWT secret not configured" });
            return;
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        req.user = user as IUser;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Token expired" });
            return;
        }
        res.status(500).json({ message: "Authentication failed" });
    }
};
