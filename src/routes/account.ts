import express from "express"
import { prismaClient } from "../db"
import redis from "../redisClient"
import { authMiddleware } from "../middleware/authMiddleware"
import { JsonObject } from "@prisma/client/runtime/library"

const app = express()
app.use(express.json())

export const accountRouter = express.Router();

accountRouter.get("/items/:type", authMiddleware, async (req, res) => {
    const type = req.params.type

    const cachedKey = `currentUserData:${req.email}:${type}`

    try {
        const cachedData = await redis.get(cachedKey)
        if (cachedData) {
            console.log("Cache Hit!");
            console.log(cachedData)
            return res.status(200).json({
                items: JSON.parse(cachedData).map((items: JsonObject) => ({
                    id: items.itemNo,
                    item: items.item,
                    cost: items.cost
                }))});
        }

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
        console.log(itemList, JSON.stringify(itemList))
        await redis.setEx(cachedKey, 3600, JSON.stringify(itemList))

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
    
    const cacheKeyMonthWise = `history:${req.email}:${month}:${year}:${type}`

    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0)

    try {
        const cachedData = await redis.get(cacheKeyMonthWise)
        if (cachedData) {
            console.log("Cache Hit!")
            return res.json(JSON.parse(cachedData))
        }

        console.log("Cache Miss. Fetching from DB...")

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
        await redis.setEx(cacheKeyMonthWise, 3600, JSON.stringify(items))
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
    const date = new Date()

    const cacheKeyMonthWise = `history:${req.email}:${date.getMonth() + 1}:${date.getFullYear()}:${req.body.type}`
    const cachedKey = `currentUserData:${req.email}:${req.body.type}`
    await redis.del(cacheKeyMonthWise)
    await redis.del(cachedKey)

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
    const date = new Date()
    const cacheKeyMonthWise = `history:${req.email}:${date.getMonth() + 1}:${date.getFullYear()}:${req.body.type}`
    const cachedKey = `currentUserData:${req.email}:${req.body.type}`
    await redis.del(cacheKeyMonthWise)
    await redis.del(cachedKey)

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

    const date = new Date()
    const cacheKeyMonthWise = `history:${req.email}:${date.getMonth() + 1}:${date.getFullYear()}:${req.body.type}`
    const cachedKey = `currentUserData:${req.email}:${req.body.type}`
    await redis.del(cacheKeyMonthWise)
    await redis.del(cachedKey)

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