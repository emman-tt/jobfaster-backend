import { WebSocketServer } from "ws";
import {
  connection,
  getAiQueue,
  getAiWorker,
  getMailQueue,
  onAiWorkerReady,
  onMailWorkerReady,
} from "./worker.js";
import { WebSocket } from "ws";
import { uploadResume } from "../controllers/Program/file.js";
import { Parse } from "./pdfParsee.js";
import { sendSocketError } from "../utils/sendSocketError.js";
import { logError } from "../utils/logger.js";
export const socket = new WebSocketServer({ port: 5000 });
import { authenticateSocket } from "../middleware/authenticate.js";
const clients = new Map<string, WebSocket>();
import { Request } from "express";
socket.on("connection", async (ws: WebSocket, req: Request) => {
  const userId = authenticateSocket(req, ws);

  if (!userId) {
    ws.close(1008, "Unauthorized");
    return;
  }
  clients.set(userId, ws);

  console.log("Client connected");

  ws.send(
    JSON.stringify({
      type: "connected",
      message: "JobFaster connected from be",
    }),
  );

  ws.on("message", async (dataInput) => {
    try {
      const input = dataInput.toString();
      const parsed = JSON.parse(input);
      const { type, data } = parsed;

      if (type == "JOB_APPLY") {
        return handleJobApply(data, "JOB_APPLY", ws, userId);
      }

      if (type == "JOB_MAIL") {
        return handleJobMail(data, "JOB_MAIL", ws, userId);
      }
    } catch (error: any) {
      sendSocketError(ws, error, error.message, "GENERAL_SOCKET_ERROR");
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(userId);
  });
});

async function handleJobApply(
  data: any,
  type: "JOB_APPLY" = "JOB_APPLY",
  ws: WebSocket,
  userId: string,
) {
  const fileId = data.fileId;
  const resume = data.resume;
  const downloadUrl = resume?.downloadUrl;
  const jobDescription = data.jobDescription;
  const hiringEmail = data.hiringEmail;

  if (!resume || !downloadUrl || !jobDescription || !hiringEmail || !fileId) {
    return sendSocketError(ws, "VALIDATION_ERROR", "FIELDS_ARE_MISSING", type);
  }

  let aiQueue = getAiQueue();
  let retries = 0;

  while (!aiQueue && retries < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    aiQueue = getAiQueue();
    retries++;
    console.log(`Waiting for Redis... attempt ${retries}`);
  }

  if (!aiQueue) {
    throw new Error("Queue not initialized, Redis unavailable");
  }

  const dataText = await ParseOnlinePdf(resume.downloadUrl);
  const updatedData = {
    jobDescription: data.jobDescription,
    tone: data.tone,
    includeCoverLetter: data.includeCoverLetter,
    hiringEmail: data.hiringEmail,
    resumeText: dataText,
  };

  const job = await aiQueue.add(type, {
    updatedData: updatedData,
    userId: userId,
    fileId: fileId,
  });
  console.log(`Job ${job.id} added to queue`);
}
async function handleJobMail(
  data: any,
  type: "JOB_MAIL" = "JOB_MAIL",
  ws: WebSocket,
  userId: string,
) {
  const {
    to,
    userName,
    userEmail,
    subject,
    greeting,
    body,
    callToAction,
    attachmentNote,
    signOff,
    pdfUrl,
    company,
    jobTitle,
  } = data;

  if (
    !to ||
    !userName ||
    !userEmail ||
    !subject ||
    !greeting ||
    !body ||
    !pdfUrl ||
    !signOff ||
    !attachmentNote ||
    !callToAction ||
    !company ||
    !jobTitle
  ) {
    return sendSocketError(
      ws,
      "VALIDATION_ERROR",
      "MISSING_REQUIRED_FIELDS",
      "JOB_MAIL",
    );
  }

  const validatedData = {
    to,
    userName,
    userEmail,
    subject,
    greeting,
    body,
    callToAction,
    attachmentNote,
    signOff,
    pdfUrl,
    company,
    jobTitle,
  };

  let mailQueue = getMailQueue();
  let retries = 0;

  while (!mailQueue && retries < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    mailQueue = getMailQueue();
    retries++;
    console.log(`Waiting for Redis... attempt ${retries}`);
  }

  if (!mailQueue) {
    throw new Error("Queue not initialized, Redis unavailable");
  }

  const job = await mailQueue.add(type, {
    validatedData: validatedData,
    userId: userId,
  });

  console.log(`Job ${job.id} added to queue`);
}

onMailWorkerReady((queue, worker) => {
  worker.on("completed", (job, result) => {
    console.log(` Job ${job.id} completed`);
    const userId = job.data?.userId as string;
    const message = JSON.stringify(result);

    const userWs = clients.get(userId);

    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(message);
    }
  });

  worker.on("active", (job) => {
    console.log(` Job ${job.id} started`);
    const message = JSON.stringify({ type: job.name, jobId: job.id });
    const userId = job.data?.userId as string;

    const userWs = clients.get(userId);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(message);
    }
  });

  worker.on("failed", (job, error) => {
    logError(error, {
      file: "socket.ts",
      function: "onMailWorkerReady",
      line: 192,
    });
    const message = JSON.stringify({
      status: "failed",
      jobId: job?.id,
      error: error.message,
    });
    const userId = job?.data?.userId as string;

    const userWs = clients.get(userId);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(message);
    }
  });
});
onAiWorkerReady((queue, worker) => {
  worker.on("completed", (job, result) => {
    console.log(` Job ${job.id} completed`);
    const message = JSON.stringify(result);

    const userId = job.data?.userId as string;
    const userWs = clients.get(userId);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(message);
    }
  });

  worker.on("active", (job) => {
    console.log(` Job ${job.id} started`);
    const message = JSON.stringify({ type: job.name, jobId: job.id });

    const userId = job.data?.userId as string;
    const userWs = clients.get(userId);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(message);
    }
  });

  worker.on("failed", (job, error) => {
    logError(error, {
      file: "socket.ts",
      function: "onAiWorkerReady",
      line: 230,
    });
    const message = JSON.stringify({
      status: "failed",
      jobId: job?.id,
      error: error.message,
    });

    const userId = job?.data?.userId as string;
    const userWs = clients.get(userId);
    if (userWs?.readyState === WebSocket.OPEN) {
      userWs.send(message);
    }
  });
});

async function ParseOnlinePdf(fileUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const result = await Parse(buffer);

    return result?.text;
  } catch (error) {
    logError(error as Error, {
      file: "socket.ts",
      function: "ParseOnlinePdf",
      line: 253,
    });
  }
}
