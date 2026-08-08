import { z } from "zod";

// Vietnamese mobile numbers: 0xxxxxxxxx or +84xxxxxxxxx (10/11 chars)
const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Vui lòng nhập email hoặc số điện thoại" })
    .refine(
      (v) =>
        v.includes("@")
          ? z.string().email().safeParse(v).success
          : phoneRegex.test(v),
      { message: "Email hoặc số điện thoại không hợp lệ" }
    ),
  password: z
    .string()
    .min(1, { message: "Vui lòng nhập mật khẩu" })
    .min(8, { message: "Mật khẩu tối thiểu 8 ký tự" }),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: "Vui lòng nhập email" })
      .email({ message: "Email không hợp lệ" }),
    phone: z
      .string()
      .min(1, { message: "Vui lòng nhập số điện thoại" })
      .regex(phoneRegex, { message: "Số điện thoại không hợp lệ" }),
    password: z
      .string()
      .min(1, { message: "Vui lòng nhập mật khẩu" })
      .min(8, { message: "Mật khẩu tối thiểu 8 ký tự" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Vui lòng xác nhận mật khẩu" })
      .min(8, { message: "Xác nhận mật khẩu tối thiểu 8 ký tự" }),
    role: z.enum(["LANDLORD", "TENANT"], {
      required_error: "Vui lòng chọn vai trò",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
