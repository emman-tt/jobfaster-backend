import express,{ Request,Response,NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";


const router = express.Router()

router.post('/checkout', authenticate)


export const PaymentRouter = router