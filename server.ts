import express from "express";
import { db } from "./database/database.js";
import router from "./routes/route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { GlobalErrorHandler } from "./utils/globalErrorHandler.js";
import { socket } from "./services/socket.js";
import { aiQueue, aiWorker, Processor } from "./services/worker.js";
const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: ["http://localhost:5174"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const clients = new Map();

socket.on("connection", (ws) => {
  ws.send(JSON.stringify("JobFaster  connected from be"));

  ws.on("message", (dataInput) => {
    const input = dataInput.toString();
    const parsed = JSON.parse(input);

    const { type, data } = parsed;

    if (type == "tailor") {
      try {
        (async () =>
          await aiQueue.add("tailor-resume", {
            data: data,
          }))();
      } catch (error) {
        console.log(error);
      }
    }



  ws.on("close", () => {
    ws.send(JSON.stringify("connection closed"));
  });
});

    aiWorker.on("completed", (job, result) => {
      const res = JSON.stringify(result);
      ws.send(res);
    });

    aiWorker.on("active", (job) => {
      console.log(`job ${job.id} has started`);
      ws.send(JSON.stringify(`Job ${job.id} started`));
    });

    aiWorker.on("failed", (job, error) => {
      console.log("error message", error);
      ws.send(JSON.stringify(`error message: ${error}`));
    });
  });

db();
app.use("/api/v1", router);
app.use(GlobalErrorHandler);

app.listen(PORT, () => {
  console.log(`Jobber backend active on port ${PORT}`);
});
