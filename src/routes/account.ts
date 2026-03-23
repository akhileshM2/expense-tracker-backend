import express from "express"
import { prismaClient } from "../db"
import redis from "../redisClient"
import jwt, { JwtPayload } from "jsonwebtoken"
import { authMiddleware } from "../middleware/authMiddleware"

const app = express()
app.use(express.json())

interface MonthlyData {
    month: string
    total: number
    types: Record<string, number>
}

const initialValue: Record<string, MonthlyData> = {}

export const accountRouter = express.Router();

accountRouter.get("/items/:type", authMiddleware, async (req, res) => {
    const type = req.params.type

    try {
        const itemList = await prismaClient.items.findMany({
            where: {
                userId: req.email,
                type: type
            },
            select: {
                itemNo: true,
                item: true,
                cost: true
            }
        })

        return res.status(200).json({
            items: itemList.map(items => ({
                id: items.itemNo,
                item: items.item,
                cost: items.cost
            }))
        })
    } catch(err) {
        res.status(411).json({
            message: "Error while fetching items."
        })
    }
})

accountRouter.get("/monthly-summary", authMiddleware, async (req, res) => {
    const { month, year } = req.query

    const type = typeof req.query.type === 'string' 
        ? req.query.type 
        : undefined;

    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0)

    try {
        const items = await prismaClient.items.findMany({
            where: {
                userId: req.email,
                type: type,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                itemNo: true,
                item: true,
                cost: true
            }
        })

        res.status(200).json(items)
    } catch (err) {
        res.status(401).json({
            message: "No data found"
        })
    }
})

accountRouter.post("/additem", authMiddleware, async (req, res) => {
    const key = `user:${req.body.userId}:itemCounter`;
    const nextItemNo = await redis.incr(key);

    if (req.email != req.body.userId || req.email === undefined) {
        return res.status(411).json({
            message: "User not found. Please try again."
        })
    }

    try {
        const request = await prismaClient.items.create({
            data: {
                item: req.body.item,
                itemNo: nextItemNo,
                cost: req.body.cost,
                type: req.body.type,
                userId: req.email
            }
        })

        return res.json({
            message: "Item added!",
            id: request.itemNo
        })
    } catch(err) {
        res.status(411).json({
            message: "Error while adding item."
        })
    }
})

accountRouter.put("/changeitem", authMiddleware, async (req, res) => {

    if (!req.body.id || req.email != req.body.email) {
        return res.status(411).json({
            message: "User not found. Please try again."
        })
    }

    try {
        const userId = await prismaClient.items.findUnique({
            where: {
                item: req.body.item,
                userId_itemNo: {
                    userId: req.body.email,
                    itemNo: req.body.id
                }
            },
            select: {
                id: true
            }
        })

        if (!userId) {
            return res.status(411).json({
                message: "User not found. Please try again."
            })
        }

        const request = await prismaClient.items.update({
            where: {
                id: userId?.id,
                userId: req.body.email
            },
            data: {
                item: req.body.newItemName,
                cost: req.body.cost
            }
        })

        return res.status(200).json({
            message: "Item updated!",
            id: request.id,
            item: request.item,
            cost: request.cost
        })
    } catch(err) {
        res.status(411).json({
            message: "Error while updating item."
        })
    }
})

accountRouter.delete("/removeitem/user/:userId/items/:itemNo", authMiddleware, async (req, res) => {
    const {userId, itemNo} = req.params

    if (req.email != userId) {
        res.status(411).json({
            message: "User not found. Please try again."
        })
        return
    }

    try {
        const request = await prismaClient.items.delete({
            where: {
                userId_itemNo: {
                    userId: userId,
                    itemNo: Number(itemNo)
                }
            }
        })

        res.status(200).json({
            message: "Item deleted!",
            itemNo: request.itemNo 
        })
    } catch (err) {
        res.status(411).json({
            message: "Item not found. Please try again."
        })
    }
})