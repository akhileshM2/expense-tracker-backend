import express from "express"
import { prismaClient } from "../db";
import { email, z } from "zod";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export const userRouter = express.Router()

const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string()
})

userRouter.get('/bulk', async (req, res) => {
    const users = await prismaClient.user.findMany({
        where: {
            name: req.body.name
        },
        select: {
            id: true,
            name: true,
            email: true
        }
    })

    res.status(200).json({
        user: users.map(user => ({
            name: user.name,
            email: user.email,
            id: user.id
        }))
    })
})

userRouter.post('/signup', async (req, res) => {
    const { success } = signupSchema.safeParse(req.body)

    if (!success) {
        res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }
    
    else {
        const user = await prismaClient.user.findUnique({
            where: {
                email: req.body.email
            },
            select: {
                id: true,
                name: true
            }
        })

        if(user) {
            res.status(411).json({
                message: "Email already taken / Incorrect inputs"
            })
            return
        }

        const request = await prismaClient.user.create({
            data: {
                email: req.body.email,
                name: req.body.name,
                password: req.body.password
            }
        })
        const token = jwt.sign({email: request.email}, JWT_SECRET)

        res.json({
            message: "Signed Up!",
            email: request.email,
            key: token,
            name: request.name
        })
    }
})

const signinSchema = z.object({
    email: z.email(),
    password: z.string().min(8)
})

userRouter.post("/signin", async (req, res) => {
    const { success } = signinSchema.safeParse(req.body)

    if(!success) {
        res.status(411).json({
            message: "Incorrect inputs"
        })
        return
    }

    const request = await prismaClient.user.findUnique({
        where: {
            email: req.body.email,
            password: req.body.password
        },
        select: {
            id: true,
            name: true,
            email: true
        }
    })

    const email = request? request.email : null
    if (!email) {
        res.status(411).json({
            message: "User does not exist, please try again!"
        })
    }

    else {
        const token = jwt.sign({email}, JWT_SECRET)
        res.status(200).json({
            token: token,
            name: request? request.name : null,
            email: request?.email
        })
    }
})