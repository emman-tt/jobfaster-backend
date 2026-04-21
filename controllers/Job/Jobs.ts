import { NextFunction, Response,Request } from "express";
import { Job } from "../../models/job";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";


export async function getJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const jobs = await Job.findAll({
      order: [["createdAt", "DESC"]],
    });
    return sendSuccess(res, 200, "success", "JOBS_FETCHED", jobs);
  } catch (error) {
    console.error(error);
    next(error)
  }
}

export async function fetchJobs() {
  const url =
    "https://jsearch.p.rapidapi.com/search?query=all&page=1&num_pages=10&date_posted=3days";
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "0fc665b46dmsh7217a451a41cceap17db42jsn3c33275226ef",
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
    console.log("done");
  } catch (error) {
    console.log(error);
  }
}
