import express from "express";
import { db } from "./database/database.js";
import router from "./routes/route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { GlobalErrorHandler } from "./utils/globalErrorHandler.js";
import "./services/socket.js";
import "./services/worker.js";
import { auth } from "./services/better-auth.js";
const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

db();

app.use("/api/v1", router);
app.use(auth.handler);
app.use(GlobalErrorHandler);

app.listen(PORT, () => {
  console.log(`Jobfaster backend active on port ${PORT}`);
});
