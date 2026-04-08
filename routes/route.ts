import express from "express";
import { authRouter } from "./auth/auth";
import { ProgramRouter } from "./Program/Program";
import { aiRouter } from "./ai/ai";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/program", ProgramRouter);
router.use("/ai", aiRouter);

export default router;
