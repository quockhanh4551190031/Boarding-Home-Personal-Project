import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Nếu true (mặc định): yêu cầu user đã hoàn thiện profile (isProfileComplete=true).
   *   - Không có session → /login
   *   - Có session nhưng !isProfileComplete → /onboarding
   *
   * Nếu false: chỉ yêu cầu có session (dùng cho /onboarding — user phải đăng nhập
   *   mới sửa được profile, nhưng không yêu cầu profile đã complete vì lúc đó
   *   isProfileComplete chắc chắn = false).
   */
  requireCompleteProfile?: boolean;
}

/**
 * Bảo vệ route theo session + profile.
 *
 * QUAN TRỌNG: phải chờ cả `loading` (khôi phục session) VÀ `profileReady` (fetch profile)
 * trước khi redirect — nếu không sẽ xảy ra **infinite redirect loop** giữa
 * `/onboarding` và `/home` (đề cập trong sprint1_tasks.md).
 */
export function ProtectedRoute({
  children,
  requireCompleteProfile = true,
}: ProtectedRouteProps) {
  const { session, loading, profile, profileReady } = useAuth();
  const location = useLocation();

  // Chờ cả 2 cờ load xong.
  if (loading || !profileReady) {
    return <FullPageSpinner />;
  }

  // Chưa đăng nhập → /login, lưu "from" để quay lại sau khi login.
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Có session, không yêu cầu complete → render luôn.
  if (!requireCompleteProfile) {
    return <>{children}</>;
  }

  // Yêu cầu complete mà chưa → /onboarding.
  // Nếu profile chưa load được (null) cũng coi như chưa complete để tránh bỏ qua.
  if (!profile || !profile.isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function FullPageSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <span className="text-sm">Đang tải…</span>
      </div>
    </div>
  );
}
