import express from "express";
import { authenticate } from "../../middleware/authenticate";
const router = express.Router();

router.post("/tailor/resume", authenticate);

export const aiRouter = router;
