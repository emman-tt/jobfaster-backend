import { Response, Request, NextFunction } from "express";
import { UserJob } from "../../models/user-jobs";
import { sendSuccess } from "../../utils/sendSuccess";

export async function saveJobTrack(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub as string;
    const job = req.body?.job;

    await UserJob.create({
      userId,
      status: "saved",
      jobId: job.jobId,
      jobTitle: job.jobTitle,
      employerName: job.employerName,
      employerLogo: job.employerLogo || null,
      employerWebsite: job.employerWebsite || null,
      jobPublisher: job.jobPublisher || null,
      jobApplyLink: job.jobApplyLink,
      jobLocation: job.jobLocation,
      jobCity: job.jobCity || null,
      jobState: job.jobState || null,
      jobCountry: job.jobCountry || null,
      jobEmploymentType: job.jobEmploymentType || "Full-time",
      jobPostedHumanReadable: job.jobPostedHumanReadable || null,
      jobDescription: job.jobDescription,
      jobIsRemote: job.jobIsRemote || false,
      jobSalaryString: job.jobSalaryString || null,
      jobMinSalary: job.jobMinSalary || null,
      jobMaxSalary: job.jobMaxSalary || null,
      jobSalaryPeriod: job.jobSalaryPeriod || null,
      jobHighlights: job.jobHighlights || {},
    });

    return sendSuccess(res, 201, "success", "JOB_SAVED");
  } catch (error) {
    next(error);
  }
}

export async function updateJobTrack(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const job = req.body?.job;
    const decoded = req.user;
    const userId = decoded?.sub;

    const updateData = Object.fromEntries(
      Object.entries(job).filter(([_, value]) => value !== undefined),
    );

    await UserJob.update(updateData, { where: { userId } });

    return sendSuccess(res, 200, "success", "JOB_UPDATED", null);
  } catch (error) {
    next(error);
  }
}
