import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { getActiveSubscription } from "../../controllers/payment/payment";

const router = express.Router();

router.get("/", authenticate, getActiveSubscription);

export const SubscriptionRouter = router;
