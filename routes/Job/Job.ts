import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { getJobs } from "../../controllers/Job/Jobs";
import { sendJobMail } from "../../controllers/Mails/jobMail";
import {
  deleteJobTrack,
  getJobTrack,
  saveJobTrack,
  updateJobTrack,
} from "../../controllers/Job/track";
import { body, validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";

const validateSaveJob = [
  body("job.jobTitle").notEmpty().withMessage("job_title is required"),
  body("job.employerName").notEmpty().withMessage("employer_name is required"),
  body("job.jobDescription")
    .notEmpty()
    .withMessage("job_description is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];

const validateUpdateJob = [
  body("job.jobId").notEmpty().withMessage("Job id required"),
  body("job.status").notEmpty().withMessage("New job status is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];
const validateDeleteJob = [
  body("job.jobId").notEmpty().withMessage("Job id required"),
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
// router.get("/:id", authenticate, getJobs);
// router.post("/mail", authenticate, sendJobMail);
router.post("/track", validateSaveJob, authenticate, saveJobTrack);
router.patch("/track", validateUpdateJob, authenticate, updateJobTrack);
router.delete("/track", validateDeleteJob, authenticate, deleteJobTrack);

export const jobRouter = router;
