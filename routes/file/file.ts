import express from "express";
const router = express.Router();
import { upload } from "../../config/diskStorage";
import { uploadResume } from "../../controllers/file/file";

router.post("/resume", upload.single("file"), uploadResume);

export const fileRouter = router;
