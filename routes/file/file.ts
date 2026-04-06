import express, { NextFunction, Request, Response } from "express";
const router = express.Router();
import { upload } from "../../config/diskStorage";
import { uploadResume } from "../../controllers/file/file";
import { authenticate } from "../../middleware/authenticate";
import { body, validationResult } from "express-validator";
import { sendError } from "../../utils/sendError";

const validateFile = [
  upload.single("file"),
  body("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("No file provided");
    }

    return true;
  }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, "NO_FILE", 422, "failed");
      return;
    }
    next();
  },
];

router.post("/resume", validateFile, authenticate, uploadResume);

export const fileRouter = router;
