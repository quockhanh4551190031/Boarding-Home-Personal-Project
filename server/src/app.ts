import express from "express";

import { errorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./utils/AppError.js";
import { requestLogger } from "./utils/logger.js";
import { authRouter } from "./routes/auth.route.js";

const app = express();

app.use(requestLogger);
app.use(express.json());

app.get("/api/ping", (_req, res) => {
  res.json({ success: true, data: { message: "pong" } });
});

app.use("/api/auth", authRouter);

app.use((req, _res, next) => {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));
});

app.use(errorHandler);

export default app;
