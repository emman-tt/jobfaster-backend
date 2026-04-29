import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { getJobs } from "../../controllers/Job/Jobs";
import { sendJobMail } from "../../controllers/Mails/jobMail";

const router = express.Router();

router.get("/", authenticate, getJobs);
router.get("/:id", authenticate, getJobs);
router.post("/mail", authenticate, sendJobMail);

export const jobRouter = router;
