import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const wss = new WebSocketServer({port:8080});
import {JWT_SECRET} from "@repo/backend-common/config";
wss.on("connection",function connection(ws,request){
    const url=request.url;
    if(!url){
        return;
    }
    const queryParams=new URLSearchParams(url.split('?')[1]);
    const token=queryParams.get("token")??""
    if(!JWT_SECRET){
        return;
    }
    const decoded=jwt.verify(token,JWT_SECRET);
    if(!decoded || !(decoded as JwtPayload).userId){
        ws.close();
        return;
    }
    ws.on("message",function message(data){
        console.log("pong");
    })
})