import { NextFunction, Request, Response } from "express";
import { auth } from "../utils/auth";

export interface AuthRequest extends Request{
    userId?:number;
    username?:string;
}

export const authMiddleware=(req:AuthRequest, res:Response, next: NextFunction)=>{

    const token=req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({error:'no auth token provided'});
    }

    const decoded=auth.verifyAccessToken(token);

    if(!decoded){
        return res.status(401).json({error:'invalid token'});
    }

    req.userId=decoded.userId;
    req.username=decoded.username;
    next();
};