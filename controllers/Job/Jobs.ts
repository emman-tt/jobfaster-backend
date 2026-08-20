import { NextFunction, Response, Request } from "express";
import { Job } from "../../models/job";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import { OcrExtract } from "../../services/ocr";
import {
  getSubscriptionWithPlan,
  getPlan,
  checkFeatureFlag,
  PlanLimitError,
} from "../../services/planEnforcer";

const { RAPID_API_KEY } = process.env;

export async function ExtractOcr(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user as any;
    const subscription = await getSubscriptionWithPlan(decoded.sub);
    const plan = getPlan(subscription);
    checkFeatureFlag(plan, "allowJobImageUploads");

    const imageFile = req.file as any;
    const buffer = imageFile.buffer;
    const result = await OcrExtract(buffer);
    const text = result.data.text;
    sendSuccess(res, undefined, undefined, "UPLOAD_SUCCESS", text);
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return sendError(res, "FEATURE_NOT_ALLOWED", 403);
    }
    next(error);
  }
}

export async function getJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 12),
    );
    const offset = (page - 1) * limit;

    const { rows: jobs, count: total } = await Job.findAndCountAll({
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    return sendSuccess(res, 200, "success", "JOBS_FETCHED", {
      data: jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    next(error);
  }
}

export async function fetchJobs() {
  const url =
    "https://jsearch.p.rapidapi.com/search?query=all&page=1&num_pages=10&date_posted=3days";
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPID_API_KEY,
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    const jobsData = result.data || [];

    const existingJobs = await Job.count();
    if (existingJobs > 0) {
      await Job.destroy({
        where: {},
        truncate: false,
      });
    }

    for (const job of jobsData) {
      await Job.create({
        jobId: job.job_id,
        jobTitle: job.job_title,
        employerName: job.employer_name,
        employerLogo: job.employer_logo || null,
        employerWebsite: job.employer_website || null,
        jobPublisher: job.job_publisher || null,
        jobApplyLink: job.job_apply_link,
        jobLocation: job.job_location,
        jobCity: job.job_city || null,
        jobState: job.job_state || null,
        jobCountry: job.job_country || null,
        jobEmploymentType: job.job_employment_type || "Full-time",
        jobPostedHumanReadable: job.job_posted_at || null,
        jobDescription: job.job_description,
        jobIsRemote: job.job_is_remote || false,
        jobSalaryString: job.job_salary_string || null,
        jobMinSalary: job.job_min_salary || null,
        jobMaxSalary: job.job_max_salary || null,
        jobSalaryPeriod: job.job_salary_period || null,
        jobHighlights: job.job_highlights || {},
      });
    }
  } catch (error) {}
}
