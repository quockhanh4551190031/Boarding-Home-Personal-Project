import type { UpdateMeInput } from "shared/schemas/user.schema";
import { apiFetch } from "../../lib/api";

/**
 * User service — wrapper cho /api/users/me.
 * Dùng trong OnboardingPage và bất kỳ trang nào cần đọc/cập nhật profile.
 */

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  cccd: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  isProfileComplete: boolean;
}

export const getMe = (): Promise<UserProfile> => apiFetch<UserProfile>("/api/users/me");

export const updateMe = (input: UpdateMeInput): Promise<UserProfile> =>
  apiFetch<UserProfile>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
