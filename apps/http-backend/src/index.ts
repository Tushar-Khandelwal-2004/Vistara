import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { middleware } from "./middleware";
dotenv.config();
import { JWT_SECRET } from "@repo/backend-common/config";

import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types"
import { prismaClient } from "@repo/db/client"


const app = express();
app.use(express.json());
app.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    console.log(parsedData)
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try{
        await prismaClient.user.create({
            data:{
                email:parsedData.data.username,
                password:parsedData.data.password,
                name:parsedData.data.name
            }
        })
    }
    catch(e){
        res.json(411).json({
            message:"Email already in use"
        })
        return;
    }
    res.json({
        userId: "123"
    })
})


app.post("/signin", (req, res) => {
    const data = SigninSchema.safeParse(req.body);
    if (!data.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    if (!JWT_SECRET) {
        return;
    }
    const userId = 1
    const token = jwt.sign({
        userId
    }, JWT_SECRET)

    res.json({
        token
    })
})


app.post("/room", middleware, (req, res) => {
    const data = CreateRoomSchema.safeParse(req.body);
    if (!data.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    // Database call
    res.status(200).json({
        roomId: "123"
    })
})


app.listen(3001);