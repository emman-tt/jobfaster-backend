import { NextFunction, Request, Response } from "express";
import express from "express";
import { handleBetterAuth, login, register } from "../../controllers/auth/auth";
import {
  forgotPassword,
  resetPassword,
} from "../../controllers/auth/passwordReset";
import { body, validationResult } from "express-validator";
import { sendError } from "../../utils/sendError";
import { RefreshAuth } from "../../middleware/authenticate";
import { logout } from "../../controllers/auth/auth";
import "dotenv/config";
const { DEVELOPMENT } = process.env;

const router = express.Router();

const validateRegister = [
  body("name")
    .notEmpty()
    .withMessage("Name is  required ")
    .isLength({ max: 150 })
    .withMessage("Name is too long"),
  body("email")
    .notEmpty()
    .trim()
    .isEmail()
    .withMessage("Email is  required")
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: true,
    }),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .trim()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-_.])[A-Za-z\d@$!%*?&#\-_.]{8,}$/,
    )
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    )
    .isLength({
      min: 5,
      max: 150,
    })
    .withMessage("Password characters must range between 5 to 150"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];
const validateLogin = [
  body("email").notEmpty().isEmail().withMessage("Email is  required"),
  body("password").notEmpty().withMessage("Password is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];

const validateResetEmail = [
  body("email")
    .notEmpty()
    .trim()
    .isEmail()
    .withMessage("Email is  required")
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: true,
    }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", RefreshAuth);
router.post("/logout", logout);
router.post("/oauth-to-jwt", handleBetterAuth);
router.post("/forgot-password", validateResetEmail, forgotPassword);
router.post("/reset-password", resetPassword);

export const authRouter = router;
