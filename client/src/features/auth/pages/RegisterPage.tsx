import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../AuthContext";
import type { LoginInput, RegisterInput } from "shared/schemas/auth.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function RegisterPage() {
  const { signUp } = useAuth();
  const [message, setMessage] = useState<{ kind: "error" | "info" | "success"; text: string } | null>(
    null
  );

  const onValid = async (values: LoginInput | RegisterInput) => {
    setMessage(null);
    const { error, session } = await signUp(values as RegisterInput);
    if (error) {
      setMessage({ kind: "error", text: error });
    } else if (!session) {
      // Supabase bật xác nhận email: record đã tạo trong auth.users nhưng chưa có session.
      setMessage({
        kind: "info",
        text: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
      });
    } else {
      setMessage({ kind: "success", text: "Đăng ký thành công!" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>Đăng ký để tìm hoặc cho thuê phòng trọ</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm type="register" onValid={onValid} />
          {message && (
            <p
              className="mt-4 text-center text-sm"
              role={message.kind === "error" ? "alert" : "status"}
              style={{
                color:
                  message.kind === "error"
                    ? "var(--color-destructive)"
                    : message.kind === "success"
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)",
              }}
            >
              {message.text}
            </p>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
