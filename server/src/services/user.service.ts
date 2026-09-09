import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { Prisma, Role } from "@prisma/client";

/**
 * User service: truy vấn + cập nhật profile người dùng.
 * Tách khỏi route để /api/users/me và /api/auth/me cùng dùng chung.
 */

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  cccd: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: Role;
  isProfileComplete: boolean;
}

const toProfile = (user: {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  cccd: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: Role;
  isProfileComplete: boolean;
}): UserProfile => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  fullName: user.fullName,
  cccd: user.cccd,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  role: user.role,
  isProfileComplete: user.isProfileComplete,
});

/**
 * Lấy profile theo auth.users.id (= public."User".id).
 * 404 nếu user chưa được đồng bộ sang public."User".
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Không tìm thấy hồ sơ người dùng");
  }
  return toProfile(user);
}

export interface UpdateUserInput {
  phone?: string;
  fullName?: string;
  cccd?: string;
}

/**
 * Cập nhật 1 phần profile.
 *
 * Nghiệp vụ (per spec Task 1.9 mục 2.2):
 * - Nếu SAU khi update mà phone + fullName đều có giá trị → isProfileComplete = true.
 * - Ngược lại giữ nguyên trạng thái cũ (nhưng thực tế false vì lúc tạo user chưa có 2 field này).
 * - Không hỗ trợ xoá trường (set null) trong scope Task 1.9.
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateUserInput,
): Promise<UserProfile> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, fullName: true },
  });
  if (!current) {
    throw new AppError(404, "USER_NOT_FOUND", "Không tìm thấy hồ sơ người dùng");
  }

  const nextPhone = input.phone !== undefined ? input.phone : current.phone;
  const nextFullName =
    input.fullName !== undefined ? input.fullName : current.fullName;
  const isProfileComplete = Boolean(nextPhone && nextFullName);

  const data: Prisma.UserUpdateInput = { isProfileComplete };
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.cccd !== undefined) data.cccd = input.cccd;

  try {
    const updated = await prisma.user.update({ where: { id: userId }, data });
    return toProfile(updated);
  } catch (error) {
    // Phone unique constraint violation (P2002)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new AppError(
        409,
        "PHONE_EXISTS",
        "Số điện thoại đã được sử dụng bởi tài khoản khác",
      );
    }
    throw error;
  }
}
