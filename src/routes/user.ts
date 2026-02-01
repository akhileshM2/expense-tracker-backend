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
    try {
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
    } catch(err) {
        res.status(411).json({
            message: "Error while fetching users. Please try again."
        })
    }
})

userRouter.post('/signup', async (req, res) => {
    const { success } = signupSchema.safeParse(req.body)

    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }
    
    else {
        try {
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
        } catch(err) {
            res.status(411).json({
                message: "Error while searching for user."
            })
        }

        const SALT_ROUNDS = 10
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS)

        try {
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
                name: request.name,
                id: request.id
            })
        } catch(err) {
            res.status(411).json({
                message: "Error while signing up user. Please try again."
            })
        }
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

    try {
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
                email: request?.email,
                id: request.id
            })
        }
    } catch(err) {
        console.log(err)
        return res.status(411).json({
            message: "Error while signing in user."
        })
    }
})

const newPasswordSchema = z.object({
    userId: z.email(),
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8)
})

userRouter.put("/changePassword", async (req, res) => {
    const { success } = newPasswordSchema.safeParse(req.body)

    if(!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const { userId, oldPassword, newPassword } = req.body

    if (oldPassword === newPassword) {
        return res.status(411).json({
            message: "New password cannot be same as the old password."
        })
    }

    const header = req.header("Authorization") || ""
    const decoded = jwt.verify(header, process.env.JWT_SECRET || "") as JwtPayload
    const email = decoded.email

    if (email != userId) {
        return res.status(411).json({
            message: "User not found. Please try again."
        })
    }
    
    
    try {
        const user = await prismaClient.user.findUnique({
            where: {
                email: userId
            },
            select: {
                id: true
            }
        })

        if(!user) {
            return res.status(411).json({
                message: "User not found. Please check you data and try again."
            })
        }

        const SALT_ROUNDS = 10
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

   
        const request = await prismaClient.user.update({
            where: {
                email: userId,
                id: user.id
            },
            data: {
                password: hashedPassword
            }
        })

        return res.status(200).json({
            message: "Password changed successfully!",
            email: request.email,
            id: request.id
        })
    } catch(err) {
        console.error("Error occured while changing password.", err)
        return res.status(411).json({
            message: "Error occured while changing password."
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