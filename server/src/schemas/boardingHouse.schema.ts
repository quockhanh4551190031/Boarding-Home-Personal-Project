import { z } from "zod";

/**
 * Zod schemas cho BoardingHouse (nhà trọ / khu trọ).
 * Backend KHÔNG import được shared/ (rootDir: src) nên mirror rule ở đây.
 */

export const createBoardingHouseSchema = z.object({
  name: z
    .string()
    .min(5, { message: "Tên nhà trọ tối thiểu 5 ký tự" })
    .max(200, { message: "Tên nhà trọ tối đa 200 ký tự" }),
  address: z
    .string()
    .min(1, { message: "Vui lòng nhập địa chỉ" })
    .max(300, { message: "Địa chỉ tối đa 300 ký tự" }),
  ward: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  lat: z
    .number({ message: "Vĩ độ phải là số" })
    .min(-90, { message: "Vĩ độ không hợp lệ (-90…90)" })
    .max(90, { message: "Vĩ độ không hợp lệ (-90…90)" }),
  lng: z
    .number({ message: "Kinh độ phải là số" })
    .min(-180, { message: "Kinh độ không hợp lệ (-180…180)" })
    .max(180, { message: "Kinh độ không hợp lệ (-180…180)" }),
  description: z.string().max(2000).optional(),
});

/** PATCH — cho phép cập nhật từng phần, nhưng phải có ít nhất 1 trường. */
export const updateBoardingHouseSchema = createBoardingHouseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export type CreateBoardingHouseInput = z.infer<typeof createBoardingHouseSchema>;
export type UpdateBoardingHouseInput = z.infer<typeof updateBoardingHouseSchema>;
