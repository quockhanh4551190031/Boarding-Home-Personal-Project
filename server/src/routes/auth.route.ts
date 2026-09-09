import { timingSafeEqual } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";

import { prisma } from "../lib/prisma.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema, registerSchema, syncUserSchema } from "../schemas/auth.schema.js";
import { getUserProfile } from "../services/user.service.js";
import { AppError } from "../utils/AppError.js";

export const authRouter = Router();

type TokenResult = { access_token: string; refresh_token: string } | { error: string };

// GoTrue password grant qua Service Role -> trả access/refresh token.
async function passwordGrant(email: string, password: string): Promise<TokenResult> {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  try {
    const resp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = (await resp.json()) as {
      access_token?: string;
      refresh_token?: string;
      error_description?: string;
      msg?: string;
    };
    if (!resp.ok || !data.access_token || !data.refresh_token) {
      return { error: data.error_description ?? data.msg ?? "Sai email hoặc mật khẩu" };
    }
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  } catch {
    return { error: "Lỗi kết nối Supabase Auth" };
  }
}

// Fallback: tìm email theo SĐT trong auth.users metadata (khi public."User" chưa có).
async function findEmailByPhoneMetadata(phone: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const found = data.users.find((u) => (u.user_metadata?.phone as string | undefined) === phone);
    if (found?.email) return found.email;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

// POST /api/auth/register  { email, phone, password, role }
authRouter.post(
  "/register",
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, phone, password, role } = req.body as {
      email: string;
      phone: string;
      password: string;
      role: "TENANT" | "LANDLORD";
    };

    if (!supabaseAdmin) {
      next(new AppError(500, "AUTH_NOT_CONFIGURED", "Supabase chưa được cấu hình"));
      return;
    }

    try {
      // 1) Tạo user trong auth.users (email_confirm: true -> login ngay ở môi trường MVP)
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { phone, role },
      });
      if (createErr || !created?.user) {
        const msg = createErr?.message ?? "Tạo tài khoản thất bại";
        const status = /already|registered|exists|duplicate/i.test(msg) ? 409 : 400;
        next(new AppError(status, status === 409 ? "EMAIL_EXISTS" : "REGISTER_FAILED", msg));
        return;
      }
      const authUser = created.user;

      // 2) Đồng bộ sang public."User" (id = auth.users.id)
      try {
        await prisma.user.create({ data: { id: authUser.id, email, phone, role } });
      } catch {
        // rollback auth.users để tránh lệch dữ liệu giữa 2 bảng
        await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(() => {});
        next(new AppError(409, "USER_EXISTS", "Email hoặc số điện thoại đã tồn tại"));
        return;
      }

      // 3) Auto-login: cấp token luôn
      const tokens = await passwordGrant(email, password);
      if ("error" in tokens) {
        res
          .status(201)
          .json({ success: true, data: { message: "Đăng ký thành công, vui lòng đăng nhập" } });
        return;
      }
      res.status(201).json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/auth/login  { identifier, password }  (identifier = email hoặc SĐT)
authRouter.post(
  "/login",
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, password } = req.body as { identifier: string; password: string };

    try {
      let email: string | null = identifier.includes("@") ? identifier : null;

      if (!email) {
        const byDb = await prisma.user
          .findUnique({ where: { phone: identifier } })
          .catch(() => null);
        email = byDb?.email ?? (await findEmailByPhoneMetadata(identifier));
        if (!email) {
          next(new AppError(401, "INVALID_CREDENTIALS", "Số điện thoại chưa được đăng ký"));
          return;
        }
      }

      const tokens = await passwordGrant(email, password);
      if ("error" in tokens) {
        next(new AppError(401, "INVALID_CREDENTIALS", tokens.error));
        return;
      }
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/auth/sync — Supabase DB Webhook: INSERT auth.users -> tạo public."User"
authRouter.post(
  "/sync",
  validate({ body: syncUserSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const expected = process.env.SUPABASE_WEBHOOK_SECRET;
    if (!expected) {
      next(new AppError(503, "WEBHOOK_DISABLED", "Webhook đồng bộ chưa được cấu hình"));
      return;
    }

    const provided = req.header("x-supabase-webhook-secret") ?? "";
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      next(new AppError(401, "INVALID_WEBHOOK_SECRET", "Sai webhook secret"));
      return;
    }

    const { record } = req.body as {
      record: {
        id: string;
        email?: string;
        raw_user_meta_data?: { phone?: string; role?: "TENANT" | "LANDLORD" | "ADMIN"; fullName?: string };
      };
    };

    try {
      const user = await prisma.user.upsert({
        where: { id: record.id },
        create: {
          id: record.id,
          email: record.email ?? "",
          phone: record.raw_user_meta_data?.phone,
          fullName: record.raw_user_meta_data?.fullName,
          role: record.raw_user_meta_data?.role ?? "TENANT",
        },
        update: {},
      });
      res.json({ success: true, data: { id: user.id, email: user.email } });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/auth/me — alias của /api/users/me (giữ để không phá test Postman cũ)
authRouter.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getUserProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});
