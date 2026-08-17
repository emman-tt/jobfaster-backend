import { Response, Request, NextFunction } from "express";
import { UserJob } from "../../models/user-jobs";
import { Subscription } from "../../models/subscription";
import { Plan } from "../../models/plans";
import { Activity } from "../../models/activity";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import { sequelize } from "../../database/pool";
import {
  PlanLimitError,
  checkApplicationLimit,
  getSubscriptionWithPlan,
  getPlan,
} from "../../services/planEnforcer";

export async function getJobTrack(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const userJobs = await UserJob.findAll({
      where: {
        userId,
      },
      order: [["createdAt", "DESC"]],
    });

    sendSuccess(res, 200, "success", "JOBS_FETCHED", userJobs);
  } catch (error) {
    next(error);
  }
}

export async function saveJobTrack(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();
  try {
    const decoded = req.user;
    const userId = decoded?.sub as string;
    const job = req.body?.job;

    const subscription = await getSubscriptionWithPlan(userId);

    if (subscription) {
      const plan = getPlan(subscription);
      checkApplicationLimit(subscription, plan);
    }

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

    if (subscription) {
      await subscription.increment("applicationsThisMonth", { transaction: t });
    }

    await t.commit();

    return sendSuccess(res, 201, "success", "JOB_SAVED");
  } catch (error) {
    await t.rollback();
    if (error instanceof PlanLimitError) {
      return sendError(res, error.code as any, 403);
    }
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
    const status = job.status;
    const jobId = job.jobId;

    const existing = await UserJob.findOne({
      where: { id: jobId, userId },
    });

    await UserJob.update(
      {
        status: status,
      },
      { where: { userId: userId, id: jobId } },
    );

    if (existing && existing.status !== status) {
      const title = existing.jobTitle || "Unknown position";
      const company = existing.employerName || "Unknown company";
      await Activity.create({
        userId,
        type: "JOB",
        message: `Updated job status from ${existing.status} to ${status} for ${title} at ${company}`,
      });
    }

    return sendSuccess(res, 200, "success", "JOB_UPDATED", null);
  } catch (error) {
    next(error);
  }
}

export async function deleteJobTrack(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;
    const jobId = req.params.jobId;

    await UserJob.destroy({
      where: {
        userId: userId,
        id: jobId,
      },
    });

    return sendSuccess(res, undefined, undefined, "JOB_DELETED");
  } catch (error) {
    next(error);
  }
}
