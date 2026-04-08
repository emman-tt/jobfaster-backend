import express from "express";
const router = express.Router();
import { tailorResume } from "../../controllers/Program/tailorResume";

router.post("/tailor/resume", tailorResume);

export const aiRouter = router;
