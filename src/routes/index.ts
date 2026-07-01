import express from "express";
import { userRouter } from "./user";
import { accountRouter } from "./account";

export const mainRouter = express.Router()

console.log("Checking DB Env:", process.env.DATABASE_URL ? "EXISTS!" : "MISSING!");
mainRouter.use("/user", userRouter)
mainRouter.use("/account", accountRouter)

