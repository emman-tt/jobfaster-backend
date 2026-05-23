import express from "express";
import { authRouter } from "./auth/auth";
import { ProgramRouter } from "./Program/Program";
import { ActvityRouter } from "./Activity/Activity";
import { jobRouter } from "./Job/Job";
import { userRouter } from "./User/user";
import { SettingsRouter } from "./Setting/settings";
import { PlansRouter } from "./Plans/plans";
import { PaymentRouter } from "./Payment/checkout";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/program", ProgramRouter);
router.use("/activity", ActvityRouter);
router.use("/job", jobRouter);
router.use("/user", userRouter);
router.use("/settings", SettingsRouter);
router.use("/plans", PlansRouter);
router.use("/payment", PaymentRouter);

export default router;
