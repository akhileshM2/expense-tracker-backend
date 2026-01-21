import express from "express";
import { userRouter } from "./user";
import { accountRouter } from "./account";

export const mainRouter = express.Router()

mainRouter.use("/user", userRouter)
mainRouter.use("/account", accountRouter)