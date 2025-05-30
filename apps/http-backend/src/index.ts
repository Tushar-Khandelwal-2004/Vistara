import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { middleware } from "./middleware";
dotenv.config();
import {JWT_SECRET} from "@repo/backend-common/config";

import {CreateUserSchema , SigninSchema , CreateRoomSchema} from "@repo/common/types"



const app=express();

app.post("/signin",(req,res)=>{
    const data=SigninSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    if(!JWT_SECRET){
        return;
    }
    const userId=1
    const token = jwt.sign({
        userId
    },JWT_SECRET)
    
    res.json({
        token
    })
})

app.post("/signup",(req,res)=>{
    const data=CreateUserSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    //db call
    res.json({
        userId:"123"
    })
})

app.post("/room",middleware,(req,res)=>{
    const data=CreateRoomSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    // Database call
    res.status(200).json({
        roomId:"123"
    })
})


app.listen(3001);