import { NextFunction, Request, Response } from "express";
import express from "express";
import { login, register } from "../../controllers/auth/auth";
import { body, validationResult } from "express-validator";
import { sendError } from "../../utils/sendError";
import { RefreshAuth } from "../../middleware/authenticate";
import { logout } from "../../controllers/auth/auth";
const router = express.Router();

const validateRegister = [
  body("name").notEmpty().withMessage("Name is  required "),
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

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", RefreshAuth);
router.post("/logout", logout);

export const authRouter = router;
