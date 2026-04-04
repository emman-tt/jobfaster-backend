import Websocket, { WebSocketServer } from "ws";
import { getAiQueue, getAiWorker, onWorkerReady } from "./worker.js";
import { WebSocket } from "ws";
import { uploadResume } from "../controllers/file/file.js";
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
    const input = dataInput.toString();
    const parsed = JSON.parse(input);
    const { type, data } = parsed;

    try {
      const aiQueue = getAiQueue();
      if (!aiQueue) {
        throw new Error("Queue not initialized, Redis unavailable");
      }

      if (type === "RESUME_UPLOAD") {
        const extractedResumeText = await uploadResume(data);
        const job = await aiQueue.add(type, {
          data: extractedResumeText,
          type: type,
        });
       return console.log(` Job ${job.id} added to queue`);
      }

      const job = await aiQueue.add(type, { data, type: type });
      console.log(` Job ${job.id} added to queue`);
      // ws.send(JSON.stringify({ type: "queued", jobId: job.id }));
    } catch (error: any) {
      console.error("Failed to add job:", error);
      ws.send(
        JSON.stringify({
          type: "JOB_APPLY",
          status: "failed",
          message: error.message,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

onWorkerReady((queue, worker) => {
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
    const message = JSON.stringify({ type: "active", jobId: job.id });

    clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  worker.on("failed", (job, error) => {
    console.log(` Job ${job?.id} failed:`, error.message);
    const message = JSON.stringify({
      type: "failed",
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
