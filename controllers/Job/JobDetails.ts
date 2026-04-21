import { Request, Response, NextFunction } from "express";
import { Job } from "../../models/job";
export async function getJobDetails(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const jobid = req.query.id as string;
    const job = Job.findByPk(jobid);
  } catch (error) {
    next(error);
  }
}
