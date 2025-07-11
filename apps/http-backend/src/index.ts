import express, { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { middleware } from "./middleware";
dotenv.config();
import { JWT_SECRET } from "@repo/backend-common/config";
import bcrypt from "bcrypt"
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types"
import { prismaClient } from "@repo/db/client"
import cors from "cors";

const app = express();
app.use(cors());

app.use(express.json());
app.post("/signup", async (req, res) => {  // // user signup
    const parsedData = CreateUserSchema.safeParse(req.body);

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


app.post("/signin", async (req, res) => { // user signin
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


app.post("/room", middleware, async (req, res) => {  // Create a room
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const userId = (req as Request & { userId: string }).userId;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.status(200).json({
            roomId: room.id
        })
    } catch (e) {
        res.status(411).json({
            message: "Name must be unique"
        })
    }
    return;
})

app.get("/chats/:roomId", async (req, res) => { // returns previous chats
    try {
        const roomId = Number(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        })
        res.json({
            messages
        })
    } catch (e) {
        res.json({
            messages: []
        })
    }
})

app.get("/room/:slug", async (req, res) => {  // returns room id corresponding to the slug
    try{
        const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    })
    res.json({
        room
    })
    }catch(e){
        res.status(402).send({
            success:false,
            message:"Room does not exists."
        })
    }

})

app.get("/me", async (req, res) => {  // checks for token
    const token = req.headers["authorization"] ?? "";
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (!decoded.userId) {
            res.status(401).send({
                success: false
            })
            return;
        }
        const user = await prismaClient.user.findFirst({
            where: {
                id: decoded.userId
            }
        })
        if (!user) {
            res.status(401).send({
                success: false
            })
            return;
        }
        res.status(200).send({
            success: true,
            userId: user.id
        })
    } catch (e) {
        res.status(401).send({
            success: false
        })
        return;
    }
})

app.get("/roomlist", async (req, res) => { // returns the room created by user
    const token = req.headers["authorization"] ?? "";
    if (!token) {
        res.status(401).send({
            success: false,
            message: "Token not provided"
        })
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (!decoded || !decoded.userId) {
            res.status(401).send({
                success: false
            })
            return;
        }
        const userId=decoded.userId;
        const rooms=await prismaClient.room.findMany({
            where:{
                adminId:userId
            }
        });
        res.status(200).send({
            success:true,
            rooms
        })
    } catch (e) {
        res.status(403).send({
            success:false,
            message:"Error"
        })
    }
})



app.listen(3001);