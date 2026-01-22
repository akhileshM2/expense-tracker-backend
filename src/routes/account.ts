import express from "express"
import { prismaClient } from "../db"
import redis from "../redisClient"
import jwt, { JwtPayload } from "jsonwebtoken"

const app = express()
app.use(express.json())

export const accountRouter = express.Router();

accountRouter.get("/items", async (req, res) => {
    const header = req.header("Authorization") || ""
    const decoded = jwt.verify(header, process.env.JWT_SECRET || "") as JwtPayload
    const email = decoded.email
    console.log(decoded)

    const itemList = await prismaClient.items.findMany({
        where: {
            userId: email
        },
        select: {
            itemNo: true,
            item: true,
            cost: true
        }
    })

    res.status(200).json({
        items: itemList.map(items => ({
            id: items.itemNo,
            item: items.item,
            cost: items.cost
        }))
    })
})

accountRouter.post("/additem", async (req, res) => {
    const key = `user:${req.body.userId}:itemCounter`;
    const nextItemNo = await redis.incr(key);

    const header = req.header("Authorization") || ""
    const decoded = jwt.verify(header, process.env.JWT_SECRET || "") as JwtPayload
    const email = decoded.email
    console.log(decoded)

    if (email != req.body.userId) {
        res.status(411).json({
            message: "User not found. Please try again."
        })
        return
    }

    const request = await prismaClient.items.create({
        data: {
            item: req.body.item,
            itemNo: nextItemNo,
            cost: req.body.cost,
            userId: email
        }
    })

    res.json({
        message: "Item added!",
        id: request.itemNo
    })
})

accountRouter.put("/changeitem", async (req, res) => {
    const header = req.header("Authorization") || ""
    const decoded = jwt.verify(header, process.env.JWT_SECRET || "") as JwtPayload
    const email = decoded.email

    if (!req.body.id || email != req.body.email) {
        res.status(411).json({
            message: "User not found. Please try again."
        })
        return
    }

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
        res.status(411).json({
            message: "User not found. Please try again."
        })
        return
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

    res.status(200).json({
        message: "Item updated!",
        id: request.id,
        item: request.item,
        cost: request.cost
    })
})

accountRouter.delete("/removeitem/user/:userId/items/:itemNo", async (req, res) => {
    const {userId, itemNo} = req.params

    const header = req.header("Authorization") || ""
    const decoded = jwt.verify(header, process.env.JWT_SECRET || "") as JwtPayload
    const email = decoded.email
    console.log(decoded)

    if (email != userId) {
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