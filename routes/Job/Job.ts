import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { ExtractOcr, getJobs } from "../../controllers/Job/Jobs";
import { sendJobMail } from "../../controllers/Mails/jobMail";
import {
  deleteJobTrack,
  getJobTrack,
  saveJobTrack,
  updateJobTrack,
} from "../../controllers/Job/track";
import { body, param, query, validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import { OcrExtract } from "../../services/ocr";
import { upload } from "../../config/diskStorage";
import { sendError } from "../../utils/sendError";

const validateSaveJob = [
  body("job.jobTitle").notEmpty().withMessage("job_title is required"),
  body("job.employerName").notEmpty().withMessage("employer_name is required"),
  body("job.jobDescription")
    .notEmpty()
    .withMessage("job_description is required"),
  body("job.jobId").notEmpty().withMessage("job_id is required"),
  body("job.jobApplyLink").notEmpty().withMessage("job_apply_link is required"),
  body("job.jobLocation").notEmpty().withMessage("job_location is required"),
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
  param("jobId").notEmpty().withMessage("Job id required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];

const validateUploadImage = [
  upload.single("file"),
  body("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("No image provided");
    }

    return true;
  }),
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
router.post("/track", validateSaveJob, authenticate, saveJobTrack);
router.patch("/track", validateUpdateJob, authenticate, updateJobTrack);
router.delete("/track/:jobId", validateDeleteJob, authenticate, deleteJobTrack);
router.post("/extract/image", validateUploadImage,authenticate, ExtractOcr );
export const jobRouter = router;
