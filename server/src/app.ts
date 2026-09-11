import "dotenv/config";
import cors from "cors";
import express from "express";

import { errorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./utils/AppError.js";
import { requestLogger } from "./utils/logger.js";
import { authRouter } from "./routes/auth.route.js";
import { userRouter } from "./routes/user.route.js";
import { boardingHouseRouter } from "./routes/boardingHouse.route.js";

const app = express();

// CORS: cho phép FE ở origin riêng gọi vào (local dev Vite :5173 hoặc :5174).
// Trên Vercel prod thì FE/BE cùng origin nên header này không có tác dụng — vẫn an toàn.
// CORS_ORIGIN = danh sách origin cách nhau bằng dấu phẩy; mặc định localhost:5173.
const isDev = process.env.NODE_ENV !== "production";

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Trong dev, Vite có thể nhảy port (5173 bận → 5174, 5175...). Tự allow mọi
// localhost/127.0.0.1 để khỏi phải sửa env mỗi lần. Prod KHÔNG dùng nhánh này.
const isLocalhostOrigin = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // Cùng origin / curl / Postman (không có Origin header) -> cho qua
      if (!origin) {
        callback(null, true);
        return;
      }
      // Explicit allowlist (env CORS_ORIGIN hoặc default)
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Dev mode: tự allow localhost/127.0.0.1 với bất kỳ port nào
      if (isDev && isLocalhostOrigin(origin)) {
        callback(null, true);
        return;
      }
      // Từ chối im lặng: không set CORS headers, browser sẽ tự chặn.
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(requestLogger);
app.use(express.json());

app.get("/api/ping", (_req, res) => {
  res.json({ success: true, data: { message: "pong" } });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/boarding-houses", boardingHouseRouter);

app.use((req, _res, next) => {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));
});

app.use(errorHandler);

export default app;
