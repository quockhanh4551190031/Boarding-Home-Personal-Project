import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useAuth } from "../../auth/AuthContext";

/**
 * Placeholder Home — dùng để verify Task 1.9 flow:
 * login → /onboarding → fill form → /home.
 * Sẽ được thay thế bằng dashboard thật ở Sprint 2.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Trang chủ</CardTitle>
          <CardDescription>
            Sprint 1 — placeholder. Dashboard thật sẽ có ở Sprint 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile ? (
            <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
              <dt className="text-muted-foreground">Họ tên</dt>
              <dd className="font-medium">{profile.fullName ?? "—"}</dd>
              <dt className="text-muted-foreground">Số điện thoại</dt>
              <dd className="font-medium">{profile.phone ?? "—"}</dd>
              <dt className="text-muted-foreground">CCCD</dt>
              <dd className="font-medium">{profile.cccd ?? "—"}</dd>
              <dt className="text-muted-foreground">Vai trò</dt>
              <dd className="font-medium">{profile.role}</dd>
              <dt className="text-muted-foreground">Profile</dt>
              <dd className="font-medium">
                {profile.isProfileComplete ? "✓ Hoàn thiện" : "Chưa hoàn thiện"}
              </dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Đang tải hồ sơ…
            </p>
          )}

          <Button variant="outline" onClick={handleSignOut} className="w-full">
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
