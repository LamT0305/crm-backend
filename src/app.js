import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import session from "express-session";
import passport from "./config/passport.js";
import authRouter from "./router/authRoute.js";

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Middleware
app.use(express.json()); // Parse JSON body
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Logging
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Change this in .env
    resave: false,
    saveUninitialized: false,
  })
);

// connect db
connectDB();

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//Routes

app.use("/api/v1/auth", authRouter);

export default app; // Export app (without starting the server)
