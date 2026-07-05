import { Redis } from "ioredis";
import { Queue, Worker } from "bullmq";
import { jobApply } from "../controllers/ai/ai";
import { sendJobMail } from "../controllers/Mails/jobMail";
import { logError, logInfo } from "../utils/logger.js";
import { File } from "../models/file";
import { sequelize } from "../database/pool";
import { Activity } from "../models/activity";
import { UserJob } from "../models/user-jobs";
import { Subscription } from "../models/subscription";
import { v4 as uuidv4 } from "uuid";
import {
  createInMemoryQueue,
  createInMemoryWorker,
  getInMemoryQueue,
  getInMemoryWorker,
} from "./inMemoryQueue.js";

const { REDIS_URL, DISABLE_REDIS } = process.env;

const useInMemory = DISABLE_REDIS === "true" || !REDIS_URL;

let aiQueue: Queue | ReturnType<typeof createInMemoryQueue> | null = null;
let aiWorker: Worker | ReturnType<typeof createInMemoryWorker> | null = null;
let mailQueue: Queue | ReturnType<typeof createInMemoryQueue> | null = null;
let mailWorker: Worker | ReturnType<typeof createInMemoryWorker> | null = null;
let connection: Redis | null = null;

if (useInMemory) {
  logInfo("Using in-memory queue (Redis disabled)", {
    disabled: !!DISABLE_REDIS,
    noRedisUrl: !REDIS_URL,
  });

  aiQueue = createInMemoryQueue("ai", {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
    },
  });

  mailQueue = createInMemoryQueue("email", {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  });

  aiWorker = createInMemoryWorker("ai", AiProcessor, {
    drainDelay: 30,
    removeOnFail: { count: 100 },
    removeOnComplete: { count: 100 },
  });

  mailWorker = createInMemoryWorker("email", EmailProcessor, {
    drainDelay: 30,
    removeOnFail: { count: 100 },
    removeOnComplete: { count: 100 },
  });
} else {
  logInfo("REDIS_URL: set (using BullMQ)");

  connection = new Redis(REDIS_URL!, {
    maxRetriesPerRequest: null,
    connectTimeout: 15000,
    enableOfflineQueue: true,
    tls: {
      checkServerIdentity: () => undefined,
    },
    retryStrategy: (times) => {
      if (times > 4) {
        logInfo(
          "Redis unreachable after multiple attempts, retrying every 30s",
          { attempts: times },
        );
        return 30000;
      }
      logInfo("Redis retry attempt", { attempt: times });
      return Math.min(times * 1000, 5000);
    },
  });

  connection.on("connecting", () => logInfo("Redis connecting..."));
  connection.on("connect", () => logInfo("Redis connected"));
  connection.on("ready", () => logInfo("Redis ready"));
  connection.on("error", (err) =>
    logError(err, { file: "worker.ts", function: "connection", line: 44 }),
  );
  connection.on("close", () => logInfo("Redis closed"));

  logInfo("Initializing BullMQ queues and workers...");

  aiQueue = new Queue("ai", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
    },
  });

  mailQueue = new Queue("email", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  });

  aiWorker = new Worker("ai", AiProcessor, {
    connection,
    drainDelay: 30,
    removeOnFail: { count: 100 },
    removeOnComplete: { count: 100 },
  });

  aiWorker.on("error", (err) => {
    logError(err, {
      file: "worker.ts",
      function: "aiWorker",
      line: 213,
    });
  });

  aiWorker.on("failed", (job, err) => {
    logError(err, {
      file: "worker.ts",
      function: "aiWorker",
      line: 217,
    });
  });

  mailWorker = new Worker("email", EmailProcessor, {
    connection,
    drainDelay: 30,
    removeOnFail: { count: 100 },
    removeOnComplete: { count: 100 },
  });

  mailWorker.on("error", (err) => {
    logError(err, {
      file: "worker.ts",
      function: "mailWorker",
      line: 230,
    });
  });

  mailWorker.on("failed", (job, err) => {
    logError(err, {
      file: "worker.ts",
      function: "mailWorker",
      line: 234,
    });
  });
}

export { connection };

interface ProcessorResponse {
  status: "success" | "failed";
  response: string;
  timestamp: string;
  jobId: string;
  fileId?: string;
  rawData?: any;
  type: "JOB_APPLY" | "JOB_MAIL" | string;
  message: string;
}

interface EmailInput {
  to: string;
  userName: string;
  userEmail: string;
  subject: string;
  greeting: string;
  body: string;
  callToAction: string;
  attachmentNote: string;
  signOff: string;
  pdfUrl: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}

export async function EmailProcessor(job: any): Promise<ProcessorResponse> {
  const { data } = job;
  const type = job.name as string;
  const userId = data.userId;
  const validatedData = data.validatedData as EmailInput;
  const t = await sequelize.transaction();
  try {
    const result = await sendJobMail(validatedData);

    if (result.status == "failed") {
      return handleError("failed", "JOB_MAIL", job, result, data);
    }

    await Activity.create(
      {
        userId: userId,
        message: `Applied for a job as ${validatedData.jobTitle} at ${validatedData.company}`,
        type: "MAIL",
      },
      { transaction: t },
    );

    const newJobId = uuidv4();

    await UserJob.create(
      {
        userId: userId,
        jobId: newJobId,
        status: "applied",
        employerName: validatedData.company,
        jobLocation: job.jobLocation,
        jobTitle: validatedData.jobTitle,
        jobEmploymentType: "unknown",
        jobDescription: validatedData.jobDescription,
        jobIsRemote: false,
        jobHighlights: {},
      },
      { transaction: t },
    );

    await Subscription.increment("applicationsThisMonth", {
      by: 1,
      where: { userId, isActive: true },
      transaction: t,
    });

    await t.commit();

    return {
      status: "success",
      type: "JOB_MAIL",
      jobId: job.id || "unknown",
      response: result.data,
      timestamp: new Date().toISOString(),
      message: "Email sent successfully",
    };
  } catch (error: any) {
    await t.rollback();
    logError(error, {
      file: "worker.ts",
      function: "EmailProcessor",
      line: 100,
    });
    return handleError("failed", "JOB_APPLY", job, error.message, data);
  }
}

export async function AiProcessor(job: any): Promise<ProcessorResponse> {
  const { data } = job;
  const type = job.name as string;
  const userId = data.userId as string;
  const fileId = data.fileId;

  logInfo("Processing AI job", { userId, jobId: job.id, type });

  try {
    const response = await jobApply(data.updatedData);

    if (response.statusCode === 200 && type === "JOB_APPLY") {
      return handleJobApply(
        undefined,
        response.response,
        "JOB_APPLY",
        job,
        data,
        fileId,
        userId,
      );
    }
    return handleError("failed", "JOB_APPLY", job, response, data);
  } catch (error: any) {
    logError(error, { file: "worker.ts", function: "AiProcessor", line: 129 });
    return handleError("failed", "JOB_APPLY", job, error.message, data);
  }
}

async function handleJobApply(
  status: "success" = "success",
  response: any,
  type: "JOB_APPLY",
  job: any,
  data: any,
  fileId: string,
  userId: string,
) {
  const parsed = parseResponse(response);

  const resumeJSON = parsed.data.resume;

  await File.update({ parsedContent: resumeJSON }, { where: { id: fileId } });

  const jobTitle = resumeJSON.personal.contactDetails.jobTitle;

  await Activity.create({
    type: "FILE",
    message: `Generated a tailored resume for ${jobTitle}`,
    userId: userId,
  });

  return {
    status,
    type,
    jobId: job.id || "unknown",
    response: parsed.data,
    fileId: data.fileId,
    timestamp: new Date().toISOString(),
    message: response.message || "done",
  };
}

function handleError(
  status: "failed" = "failed",
  type: "JOB_APPLY" | string,
  job: any,
  response: any,
  data: any,
) {
  return {
    status,
    type,
    jobId: job.id || "unknown",
    response: response?.data || response || null,
    fileId: data?.fileId,
    timestamp: new Date().toISOString(),
    message: response?.message || "error",
  };
}

export const getAiQueue = () => {
  if (useInMemory) {
    return getInMemoryQueue("ai");
  }
  return aiQueue;
};

export const getAiWorker = () => {
  if (useInMemory) {
    return getInMemoryWorker("ai");
  }
  return aiWorker;
};

export const getMailQueue = () => {
  if (useInMemory) {
    return getInMemoryQueue("email");
  }
  return mailQueue;
};

export const getMailWorker = () => {
  if (useInMemory) {
    return getInMemoryWorker("email");
  }
  return mailWorker;
};

export const onMailWorkerReady = (
  callback: (queue: any, worker: any) => void,
): (() => void) => {
  const mq = getMailQueue();
  const mw = getMailWorker();

  if (mq && mw) {
    callback(mq, mw);
    return () => {};
  }

  if (useInMemory) {
    return () => {};
  }

  const checkInterval = setInterval(() => {
    const q = getMailQueue();
    const w = getMailWorker();
    if (q && w) {
      clearInterval(checkInterval);
      callback(q, w);
    }
  }, 100);

  return () => clearInterval(checkInterval);
};

export const onAiWorkerReady = (
  callback: (queue: any, worker: any) => void,
): (() => void) => {
  const aq = getAiQueue();
  const aw = getAiWorker();

  if (aq && aw) {
    callback(aq, aw);
    return () => {};
  }

  if (useInMemory) {
    return () => {};
  }

  const checkInterval = setInterval(() => {
    const q = getAiQueue();
    const w = getAiWorker();
    if (q && w) {
      clearInterval(checkInterval);
      callback(q, w);
    }
  }, 100);

  return () => clearInterval(checkInterval);
};

interface ParsedData {
  success: boolean;
  data: any;
  raw: string;
}

const parseResponse = (rawResponse: any): ParsedData => {
  try {
    const cleaned = rawResponse
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.resume || !parsed.email) {
      return { success: false, data: "invalid response", raw: rawResponse };
    }

    return { success: true, data: parsed, raw: rawResponse };
  } catch (err) {
    logError(err as Error, {
      file: "worker.ts",
      function: "parseResponse",
      line: 298,
    });
    return { success: false, data: "parsing failed", raw: rawResponse };
  }
};
