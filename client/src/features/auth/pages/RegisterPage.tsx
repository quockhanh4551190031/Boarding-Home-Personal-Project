import { Link } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tạo tài khoản NhàTrọ</CardTitle>
          <CardDescription>Đăng ký để tìm hoặc cho thuê phòng trọ</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            type="register"
            onValid={(values) => console.log("register submit", values)}
          />
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
