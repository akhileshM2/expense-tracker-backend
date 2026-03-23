import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      email?: string,
      split?: string,
      startsWith?: string
    }
  }
}

export {};