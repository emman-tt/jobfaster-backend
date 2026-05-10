import express, { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";
import { FetchSettingsData } from "../../controllers/settings/settings";
import { sendError } from "../../utils/sendError";
import { body } from "express-validator";
import { upload } from "../../config/diskStorage";
import { updateUserData } from "../../controllers/User/user";

const router = express.Router();

const validateUserUpdate = [
  body("name").optional().notEmpty().withMessage("Username is required").trim(),
  body("email")
    .optional()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Improper email format")
    .trim()
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: true,
    }),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      const allowedTypes = ["image"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return sendError(res, "INVALID_FILE_TYPE", 422, "failed");
      }
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return sendError(res, "FILE_TOO_LARGE", 422, "failed");
      }
    }
    next();
  },
];

router.get("/", authenticate, FetchSettingsData);
router.patch("/", upload.single("file"), validateUserUpdate, authenticate);
router.patch("/", updateUserData);
router.delete("/", authenticate);

export const SettingsRouter = router;
