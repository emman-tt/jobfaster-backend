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
export const socket = new WebSocketServer({ port: 5000 });

const clients = new Set<WebSocket>();

socket.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  clients.add(ws);

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
        return handleJobApply(data, "JOB_APPLY", ws);
      }

      if (type == "JOB_MAIL") {
        return handleJobMail(data, "JOB_MAIL", ws);
      }
    } catch (error: any) {
      sendSocketError(ws, error, error.message, "GENERAL_SOCKET_ERROR");
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

async function handleJobApply(
  data: any,
  type: "JOB_APPLY" = "JOB_APPLY",
  ws: WebSocket,
) {
  const resume = data.resume;

  if (
    !resume ||
    !data.resume.downloadUrl ||
    data.jobDescription ||
    !data.hiringEmail
  ) {
    return sendSocketError(
      ws,
      "VALIDATION_ERROR",
      "FIELDS_ARE_MISSING",
      "JOB_MAIL",
    );
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

  const job = await aiQueue.add(type, { updatedData });
  console.log(`Job ${job.id} added to queue`);
}
async function handleJobMail(
  data: any,
  type: "JOB_MAIL" = "JOB_MAIL",
  ws: WebSocket,
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
    !callToAction
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

  const job = await mailQueue.add(type, { validatedData });
  console.log(`Job ${job.id} added to queue`);
}

onMailWorkerReady((queue, worker) => {
  worker.on("completed", (job, result) => {
    console.log(` Job ${job.id} completed`);
    const message = JSON.stringify(result);

    clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  worker.on("active", (job) => {
    console.log(` Job ${job.id} started`);
    const message = JSON.stringify({ type: job.name, jobId: job.id });

    clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  worker.on("failed", (job, error) => {
    console.log(` Job ${job?.id} failed:`, error.message);
    const message = JSON.stringify({
      status: "failed",
      jobId: job?.id,
      error: error.message,
    });

    clients.forEach((ws: any) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });
});
onAiWorkerReady((queue, worker) => {
  worker.on("completed", (job, result) => {
    console.log(` Job ${job.id} completed`);
    const message = JSON.stringify(result);

    clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  worker.on("active", (job) => {
    console.log(` Job ${job.id} started`);
    const message = JSON.stringify({ type: job.name, jobId: job.id });

    clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  worker.on("failed", (job, error) => {
    console.log(` Job ${job?.id} failed:`, error.message);
    const message = JSON.stringify({
      status: "failed",
      jobId: job?.id,
      error: error.message,
    });

    clients.forEach((ws: any) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });
});

async function ParseOnlinePdf(fileUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const result = await Parse(buffer);

    return result?.text;
  } catch (error) {
    console.log(error);
  }
}
