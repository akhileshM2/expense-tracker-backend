import express from "express"
import { prismaClient } from "../db";
import { z } from "zod";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from 'bcrypt';

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

    return res.status(200).json({
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
        return res.status(411).json({
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
            return res.status(411).json({
                message: "Email already taken / Incorrect inputs"
            })
        }

        const SALT_ROUNDS = 10
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS)

        const request = await prismaClient.user.create({
            data: {
                email: req.body.email,
                name: req.body.name,
                password: hashedPassword
            }
        })
        const token = jwt.sign({email: request.email}, process.env.JWT_SECRET || "")

        return res.json({
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
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const request = await prismaClient.user.findUnique({
        where: {
            email: req.body.email
        },
        select: {
            id: true,
            name: true,
            email: true,
            password: true
        }
    })

    if (!request) {
        return res.status(401).json({
            error: "Invalid credentials"
        })
    }

    const isMatch = await bcrypt.compare(req.body.password, request.password)

    if (!isMatch) {
        return res.status(401).json({ 
            error: "Invalid credentials" 
        })
    }

    const email = request? request.email : null
    if (!email) {
        return res.status(411).json({
            message: "User does not exist, please try again!"
        })
    }

    else {
        const token = jwt.sign({email}, process.env.JWT_SECRET || "")
        return res.status(200).json({
            token: token,
            name: request? request.name : null,
            email: request?.email
        })
    }
})

userRouter.delete("/removeUser/user/:userId/id/:id", async (req, res) => {
    const { userId, id } = req.params

    const header = req.header("Authorization") || ""
    const decoded = jwt.verify(header, process.env.JWT_SECRET || "") as JwtPayload
    const email = decoded.email

    if (email != userId) {
        return res.status(411).json({
            message: "User not found. Please try again."
        })
    }

    try {
        const request = await prismaClient.user.delete({
            where: {
                email: userId,
                id: Number(id)
            },
            select: {
                id: true,
                email: true
            }
        })

        return res.status(200).json({
            message: "User deleted!",
            email: request.email,
            id: request.id 
        })
    } catch (err) {
        console.log(err)
        return res.status(411).json({
            message: "User not found. Please try again."
        })
    }
})