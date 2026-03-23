import jwt, { JwtPayload } from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("Authorization") || ""
    
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" })
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as JwtPayload
        req.email = decoded.email
        next()
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Session expired. Please login again." })
            }
        }
        return res.status(401).json({ message: "Invalid token" })
    }
};