import express from "express";
import { authRouter } from "./auth/auth";
import { fileRouter } from "./file/file";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/file", fileRouter);

export default router;
