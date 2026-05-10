import express, { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";
import { getUserData, updateUserData } from "../../controllers/User/user";
import { body, validationResult } from "express-validator";
import { upload } from "../../config/diskStorage";
import { sendError } from "../../utils/sendError";

const router = express.Router();


router.get("/", authenticate, getUserData);

export const userRouter = router;
