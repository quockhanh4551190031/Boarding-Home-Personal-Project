import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "shared/schemas/auth.schema";
import type { ReactNode } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

interface AuthFormProps {
  type: "login" | "register";
  onValid: (values: LoginInput | RegisterInput) => void;
}

export function AuthForm({ type, onValid }: AuthFormProps) {
  if (type === "register") {
    return <RegisterFields onValid={onValid} />;
  }
  return <LoginFields onValid={onValid} />;
}

function LoginFields({
  onValid,
}: {
  onValid: (values: LoginInput | RegisterInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = handleSubmit((values) => onValid(values));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Email hoặc số điện thoại" error={errors.identifier?.message}>
        <Input
          placeholder="you@example.com hoặc 0912345678"
          autoComplete="username"
          {...register("identifier")}
        />
      </Field>

      <Field label="Mật khẩu" error={errors.password?.message}>
        <Input
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Đăng nhập
      </Button>
    </form>
  );
}

function RegisterFields({
  onValid,
}: {
  onValid: (values: LoginInput | RegisterInput) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => onValid(values));

  const handleContinue = async () => {
    const ok = await trigger(["email", "phone", "password", "confirmPassword"]);
    if (ok) setStep(2);
  };

  if (step === 1) {
    return (
      <form
        noValidate
        className="space-y-4"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
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

        <Field label="Mật khẩu" error={errors.password?.message}>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("password")}
          />
        </Field>

        <Field label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
        </Field>

        <Button type="button" className="w-full" onClick={handleContinue}>
          Tiếp tục
        </Button>
      </form>
    );
  }

  const roleOptions: {
    value: "LANDLORD" | "TENANT";
    title: string;
    desc: string;
  }[] = [
    { value: "LANDLORD", title: "Chủ trọ", desc: "Tôi cho thuê phòng trọ" },
    { value: "TENANT", title: "Người ở", desc: "Tôi đang tìm phòng trọ" },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Bạn là?" error={errors.role?.message}>
        <div className="grid grid-cols-2 gap-3">
          {roleOptions.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                {...register("role")}
                className="peer sr-only"
              />
              <div className="rounded-xl border border-input p-4 text-left transition hover:border-primary peer-checked:border-primary peer-checked:bg-primary/5">
                <div className="font-display text-lg">{opt.title}</div>
                <div className="text-sm text-muted-foreground">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </Field>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setStep(1)}
        >
          Quay lại
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          Đăng ký
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
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
