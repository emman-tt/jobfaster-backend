import express, { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";
import { CreateCheckout } from "../../controllers/payment/payment";
import { getTransactions } from "../../controllers/payment/transaction";

const router = express.Router();

router.post("/checkout", authenticate, CreateCheckout);
router.get("/transactions", authenticate, getTransactions);

export const PaymentRouter = router;
