import express, { NextFunction, Request, Response } from "express";
const router = express.Router();
import { upload } from "../../config/diskStorage";
import { uploadResume } from "../../controllers/file/file";
import { authenticate } from "../../middleware/authenticate";
import { body, validationResult } from "express-validator";

const validateFile = [
  body("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("No file provided");
    }
  }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];

router.post(
  "/resume",
  upload.single("file"),
  validateFile,
  authenticate,
  uploadResume,
);

export const fileRouter = router;
