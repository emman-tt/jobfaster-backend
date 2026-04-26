import express, { NextFunction, Request, Response } from "express";
const router = express.Router();
import { upload } from "../../config/diskStorage";
import { uploadResume } from "../../controllers/Program/file";
import { saveResumePDF } from "../../controllers/Program/resumePdf";
import { authenticate } from "../../middleware/authenticate";
import { body, check, param, query, validationResult } from "express-validator";
import { sendError } from "../../utils/sendError";
import { UploadFolder } from "../../controllers/Program/folder";
import {
  deleteProgram,
  getPrograms,
  MoveFile,
} from "../../controllers/Program/Pointer";

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

const validateFolder = [
  param("folderName").notEmpty(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, "NO_FOLDER", 422, "failed");
    }
    next();
  },
];
const validateMoveFile = [
  body("fileId").notEmpty().isUUID(),
  body("folderId").notEmpty().isUUID(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendError(res, "NO_FILE", 422, "failed");
    }
    next();
  },
];

const validateDeleteFile = [
  param("id").notEmpty().isUUID(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, "NO_FILE", 422, "failed");
    }
    next();
  },
];

router.get("/", authenticate, getPrograms);
router.post("/file/upload", validateFile, authenticate, uploadResume);
router.post("/file/save", authenticate, saveResumePDF);
router.put("/file/move", validateMoveFile, authenticate, MoveFile);
router.post("/folder/:folderName", validateFolder, authenticate, UploadFolder);
router.delete("/:id", validateDeleteFile, authenticate, deleteProgram);
export const ProgramRouter = router;
