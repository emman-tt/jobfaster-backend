import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { getJobs } from "../../controllers/Job/Jobs";

const router = express.Router();

router.get("/", authenticate, getJobs);
router.get("/:id", authenticate, getJobs);

export const jobRouter = router;
