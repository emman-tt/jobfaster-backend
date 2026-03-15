import { Express } from "express";
import express from "express";
import { register } from "../../controllers/auth/auth";

const router = express.Router();

router.post("/register", register);

export const authRouter = router;
