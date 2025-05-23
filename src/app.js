import express, { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app = express()
app.use(express.json());
app.use(urlencoded({extended:true ,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// import routes
import userRouter from "./routes/user.routes.js"


// decalaring the routes

app.use("/api/users",userRouter)


export default app