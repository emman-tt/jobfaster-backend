import express from "express";
import { authRouter } from "./auth/auth";
import { ProgramRouter } from "./Program/Program";
import { aiRouter } from "./ai/ai";
import { ActvityRouter } from "./Activity/Activity";
import { jobRouter } from "./Job/Job";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/program", ProgramRouter);
router.use("/ai", aiRouter);
router.use("/activity", ActvityRouter);
router.use("/job", jobRouter);


export default router;
