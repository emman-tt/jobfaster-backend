import express from "express";
const router = express.Router();
import { upload } from "../../config/diskStorage";
router.post("/resume", upload.single('file'));


export const aiRouter = router
