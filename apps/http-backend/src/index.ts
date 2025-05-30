import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { middleware } from "./middleware";
dotenv.config();

import {JWT_SECRET} from "@repo/backend-common/config";
const app=express();

app.post("/signin",(req,res)=>{
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
    
})

app.post("/room",middleware,(req,res)=>{
    // Database call
    res.status(200).json({
        roomId:"123"
    })
})


app.listen(3001);