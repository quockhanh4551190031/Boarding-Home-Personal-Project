import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

/**
 * requireRole(...roles) — chặn request nếu role hiện tại không nằm trong danh sách.
 *
 * PHẢI dùng SAU requireAuth (cần req.user.id).
 *
 * Lý do đọc role từ DB thay vì user_metadata trong JWT:
 * JWT có thể bị stale (đổi role trong DB thì token cũ vẫn mang role cũ cho tới khi refresh).
 * Authorization là thứ nhạy cảm → luôn đọc từ nguồn authoritative. Query theo PK nên rất nhanh.
 *
 * @example
 * router.post("/", requireAuth, requireRole("LANDLORD"), handler);  // tạo nhà trọ
 * router.get("/admin/stats", requireAuth, requireRole("ADMIN"), handler);
 */
export const requireRole =
  (...allowed: Role[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new AppError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực"));
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, isActive: true },
      });

      if (!user) {
        next(
          new AppError(404, "USER_NOT_FOUND", "Không tìm thấy hồ sơ người dùng"),
        );
        return;
      }

      // Tài khoản bị Admin khoá (Sprint 6) → chặn mọi hành động
      if (!user.isActive) {
        next(
          new AppError(
            403,
            "ACCOUNT_DISABLED",
            "Tài khoản của bạn đã bị khoá",
          ),
        );
        return;
      }

      if (!allowed.includes(user.role)) {
        next(
          new AppError(
            403,
            "FORBIDDEN",
            `Chỉ ${allowed.join(" / ")} mới được thực hiện hành động này`,
          ),
        );
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

/** Shorthand hay dùng: chỉ Chủ trọ (hoặc Admin) mới được tạo/sửa/xoá phòng trọ. */
export const requireLandlord = requireRole("LANDLORD", "ADMIN");

/** Shorthand: chỉ Admin. */
export const requireAdmin = requireRole("ADMIN");
