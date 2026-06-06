import express, { Request, Response } from "express";
import { db } from "./database/database.js";
import router from "./routes/route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GlobalErrorHandler } from "./utils/globalErrorHandler.js";
import "./services/socket.js";
import "./services/worker.js";
import { auth } from "./services/better-auth.js";
import { toNodeHandler } from "better-auth/node";
import "./services/payment.js";
import { handlePaymentWebhook } from "./controllers/payment/webhook.js";
const app = express();
const PORT = 3000;

app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "failed",
    message: "Too many requests, please try again later",
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "failed",
    message: "Too many auth attempts, please try again later",
  },
});

// app.use((req: Request, res: Response, next) => {
//   if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/v1/auth")) {
//     return authLimiter(req, res, next);
//   }
//   next();
// });

// app.use(generalLimiter);

app.post(
  "/api/webhooks/lemon-squeezy",
  express.raw({
    type: "application/json",
  }),
  (req: Request, res: Response) => {
    console.log("[WEBHOOK] Handling Lemon Squeezy webhook...");
    return handlePaymentWebhook(req, res);
  },
);

app.set("etag", false);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", toNodeHandler(auth));

app.use("/api/v1", router);

app.use(GlobalErrorHandler);

async function startServer() {
  try {
    await db();
    app.listen(PORT, () => {
      console.log(`Jobfaster backend active on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
