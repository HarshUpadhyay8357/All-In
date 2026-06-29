import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET=process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET=process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export const auth={

    // hash password
    async hashPassword(password:string):Promise<string>{
        return bcryptjs.hash(password,10);
    },

    //verify password
    async verifyPassword(password:string, hash:string):Promise<boolean>{
        return bcryptjs.compare(password,hash);
    },

    //generate jwt tokens
    generateTokens(userId:number, username:string){

        const accessToken=jwt.sign(
            {userId, username},
            JWT_SECRET,
            {expiresIn:"15m"}
        );

        const refreshToken=jwt.sign(
            {userId, username},
            JWT_REFRESH_SECRET,
            {expiresIn:"7d"}
        );

        return {accessToken, refreshToken};
    },

    //verify access token
    verifyAccessToken(token:string){
        try {
            return jwt.verify(token, JWT_SECRET) as {userId:number, username:string};
            
        } catch {
            return null;
        }
    },

    //verify refresh token
    verifyRefreshToken(token:string){
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET) as {userId:number, username:string};
            
        } catch {
            return null;
        }
    }
}