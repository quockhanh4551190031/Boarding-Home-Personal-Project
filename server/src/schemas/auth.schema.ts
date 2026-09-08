import { z } from "zod";

// Mirror của shared/schemas/auth.schema.ts — backend không import được ngoài rootDir,
// nên giữ cùng rule validation (TODO: chuyển sang build shared package khi có bundler).
const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().regex(phoneRegex, "Số điện thoại không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  role: z.enum(["TENANT", "LANDLORD"]),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập email hoặc số điện thoại"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

// Payload của Supabase Database Webhook (INSERT trên auth.users).
export const syncUserSchema = z.object({
  type: z.string().optional(),
  record: z.object({
    id: z.string().uuid("id không hợp lệ"),
    email: z.string().email("Email không hợp lệ").optional(),
    raw_user_meta_data: z
      .object({
        phone: z.string().regex(phoneRegex, "Số điện thoại không hợp lệ").optional(),
        role: z.enum(["TENANT", "LANDLORD", "ADMIN"]).optional(),
        fullName: z.string().optional(),
      })
      .optional(),
  }),
});
