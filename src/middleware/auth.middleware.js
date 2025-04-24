import User from "../models/user.model.js";
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import ApiError from "../utils/apiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
try {
    const token = res.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
    
    if (!token) {
        throw new ApiError(401,"Unauthoried request")
    }
    
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     
     const user =await  User.findById(decodedToken?._id).select("-password -refreshToken")
    
     if(!user) {
        throw new ApiError(400,"User not found")
     }
     req.user = user
     next()
} catch (error) {
    throw new ApiError(400,error?.message|| "Invalid access token")
}
})