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

export function LoginPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onValid = async (values: LoginInput | RegisterInput) => {
    setError(null);
    setSuccess(false);
    const { error: err } = await signIn(values as LoginInput);
    if (err) setError(err);
    else setSuccess(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Đăng nhập bằng email hoặc số điện thoại
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm type="login" onValid={onValid} />
          {error && (
            <p className="mt-4 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 text-center text-sm text-primary" role="status">
              Đăng nhập thành công!
            </p>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
