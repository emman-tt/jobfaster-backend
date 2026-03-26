import express from "express";
import { authRouter } from "./auth/auth";
import { fileRouter } from "./file/file";
import { aiRouter } from "./ai/ai";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/file", fileRouter);
router.use("/ai", aiRouter);

export default router;
