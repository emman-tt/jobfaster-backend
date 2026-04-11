import express, { Express, Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { getActivity } from "../../controllers/Activity/Activity";

const router = Router();
router.get("/", authenticate, getActivity);

export const ActvityRouter = router;
