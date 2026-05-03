import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { getJobs } from "../../controllers/Job/Jobs";
import { sendJobMail } from "../../controllers/Mails/jobMail";
import { getJobTrack, saveJobTrack, updateJobTrack } from "../../controllers/Job/track";
import { body, validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";

const validateSaveJob = [
 
  body("job.jobTitle").notEmpty().withMessage("job_title is required"),
  body("job.employerName").notEmpty().withMessage("employer_name is required"),
  body("job.jobDescription").notEmpty().withMessage("job_description is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];

const router = express.Router();

router.get("/", authenticate, getJobs);
router.get("/track", authenticate, getJobTrack);
router.get("/:id", authenticate, getJobs);
router.post("/mail", authenticate, sendJobMail);
router.post("/track", authenticate, validateSaveJob, saveJobTrack);
router.patch("/track", authenticate, updateJobTrack);
router.delete("/track", authenticate);


export const jobRouter = router;
