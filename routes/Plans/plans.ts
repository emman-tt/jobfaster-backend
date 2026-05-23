import express from "express";
import { getPlans } from "../../controllers/plans/plans";

const router = express.Router();

router.get("/", getPlans);

export const PlansRouter = router;
