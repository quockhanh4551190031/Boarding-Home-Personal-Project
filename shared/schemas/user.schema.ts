import { z } from "zod";

// Vietnamese mobile numbers: 0xxxxxxxxx or +84xxxxxxxxx (10/11 chars)
const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * PATCH /api/users/me — body cho Onboarding form.
 * Phone + fullName bắt buộc (server dùng 2 trường này để set isProfileComplete=true).
 * cccd optional — landlord có thể cập nhật sau.
 */
export const updateMeSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Họ tên tối thiểu 2 ký tự" })
    .max(50, { message: "Họ tên tối đa 50 ký tự" }),
  phone: z
    .string()
    .regex(phoneRegex, { message: "Số điện thoại không hợp lệ" }),
  cccd: z
    .string()
    .max(20, { message: "CCCD tối đa 20 ký tự" })
    .optional()
    .or(z.literal("")),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
