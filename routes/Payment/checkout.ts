import express, { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";
import { CreateCheckout } from "../../controllers/payment/payment";

const router = express.Router();

router.post("/checkout", authenticate, CreateCheckout);

export const PaymentRouter = router;
