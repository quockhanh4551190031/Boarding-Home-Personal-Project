import { z } from "zod";

/**
 * Mirror của logic validation nằm ở backend (rootDir: src).
 * Phải khớp với shared/schemas nếu có (hiện chưa có schema này ở shared).
 */

const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * PATCH /api/users/me — body cho phép cập nhật 1 phần.
 * Ít nhất một trường phải được gửi.
 *
 * Quy tắc nghiệp vụ: nếu cả phone và fullName đều có giá trị hợp lệ
 * sau update → set isProfileComplete = true (xem user.service.ts).
 */
export const updateMeSchema = z
  .object({
    phone: z
      .string()
      .regex(phoneRegex, "Số điện thoại không hợp lệ")
      .optional(),
    fullName: z
      .string()
      .min(2, "Họ tên tối thiểu 2 ký tự")
      .max(50, "Họ tên tối đa 50 ký tự")
      .optional(),
    cccd: z.string().max(20, "CCCD tối đa 20 ký tự").optional(),
  })
  .refine(
    (data) =>
      data.phone !== undefined ||
      data.fullName !== undefined ||
      data.cccd !== undefined,
    { message: "Cần ít nhất một trường để cập nhật" },
  );

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
