import express from "express";
const router = express.Router();
import { tailorResume } from "../../controllers/file/tailorResume";

router.post("/tailor/resume", tailorResume);

export const aiRouter = router;
