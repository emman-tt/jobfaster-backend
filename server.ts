import express from "express";
import puppeteer from "puppeteer";
import { containsText } from "./utils/pupeteer.js";
import { Scraper } from "./controllers/Scraper.js";
import { db } from "./database/database.js";
import router from "./routes/route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { GlobalErrorHandler } from "./utils/globalErrorHandler.js";
const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://tilios.vercel.app"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

db();
app.use("/api", router);
app.use(GlobalErrorHandler);

app.listen(PORT, () => {
  console.log(`Jobber backend active on port ${PORT}`);
});
