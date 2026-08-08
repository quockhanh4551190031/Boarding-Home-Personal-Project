import { Link } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng nhập NhàTrọ</CardTitle>
          <CardDescription>
            Đăng nhập bằng email hoặc số điện thoại
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            type="login"
            onValid={(values) => console.log("login submit", values)}
          />
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
