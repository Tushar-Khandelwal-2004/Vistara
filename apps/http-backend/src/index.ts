import express, { Request } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { middleware } from "./middleware";
dotenv.config();
import { JWT_SECRET } from "@repo/backend-common/config";
import bcrypt from "bcrypt"
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
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 5);
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data.username,
                password: hashedPassword,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
        return;
    }
    catch (e) {
        res.status(411).json({
            message: "Email already in use"
        })
        return;
    }

})


app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username
        }
    })
    if (!user || !JWT_SECRET || !user.password) {
        res.status(411).json({
            message: "User does not exist"
        });
        return;
    }

    const passwordMatch = await bcrypt.compare(parsedData.data.password, user.password);

    if (passwordMatch) {
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET);
        res.json({
            token
        })
        return;
    }
    else {
        res.status(411).json({
            message: "Incorrect credentials"
        })
        return;
    }
})


app.post("/room", middleware, async (req, res) => {
    const parsedDdata = CreateRoomSchema.safeParse(req.body);
    if (!parsedDdata.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const userId = (req as Request & { userId: string }).userId;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedDdata.data.name,
                adminId: userId
            }
        })

        res.status(200).json({
            roomId: room.id
        })
    }catch(e){
        res.status(411).json({
            message:"Name must be unique"
        })
    }
    return;
})


app.listen(3001);