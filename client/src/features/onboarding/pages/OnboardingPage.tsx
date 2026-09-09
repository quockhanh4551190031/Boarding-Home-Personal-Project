import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateMeSchema,
  type UpdateMeInput,
} from "shared/schemas/user.schema";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useAuth } from "../../auth/AuthContext";
import { updateMe } from "../../users/userService";
import { ApiCallError } from "../../../lib/api";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshProfile, profile } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMeInput>({
    resolver: zodResolver(updateMeSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: profile?.fullName ?? "",
      phone: profile?.phone ?? "",
      cccd: profile?.cccd ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload: UpdateMeInput = {
        fullName: values.fullName,
        phone: values.phone,
        ...(values.cccd ? { cccd: values.cccd } : {}),
      };
      await updateMe(payload);
      await refreshProfile();
      navigate("/home", { replace: true });
    } catch (error) {
      if (error instanceof ApiCallError) {
        setServerError(error.message);
      } else {
        setServerError("Không thể lưu hồ sơ, vui lòng thử lại");
      }
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Hoàn thiện hồ sơ</CardTitle>
          <CardDescription>
            Cập nhật số điện thoại và họ tên để bắt đầu sử dụng ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Field label="Họ và tên" error={errors.fullName?.message}>
              <Input
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                {...register("fullName")}
              />
            </Field>

            <Field label="Số điện thoại" error={errors.phone?.message}>
              <Input
                type="tel"
                placeholder="0912345678"
                autoComplete="tel"
                {...register("phone")}
              />
            </Field>

            <Field
              label="CCCD / CMND (không bắt buộc)"
              error={errors.cccd?.message}
            >
              <Input
                placeholder="001099123456"
                autoComplete="off"
                {...register("cccd")}
              />
            </Field>

            {serverError && (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu…" : "Lưu hồ sơ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 text-left">
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
