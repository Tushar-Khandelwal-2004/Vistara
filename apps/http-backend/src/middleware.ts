import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
interface CustomRequest extends Request {
  userId?: string;
}


export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? "";
    if (!JWT_SECRET) {
        res.status(403).json({
            message:"Unauthorized"
        })
        return;
    }
    try{
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if(decoded.userId){
        (req as CustomRequest).userId=decoded.userId
        next();
    }
    else{
        res.status(403).json({
            message:"Unauthorized"
        })
        return;
    }
    }
    catch{
        res.status(403).json({
            message:"Unauthorized Token"
        })
        return;
    }


}