import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { LoginInput, RegisterInput } from "shared/schemas/auth.schema";

const API_URL = import.meta.env.VITE_API_URL || "";

// Envelope chuẩn của backend: { success, data } | { success: false, error: { code, message } }
interface ApiError {
  code?: string;
  message?: string;
}
interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: ApiError;
}

const readError = (payload: ApiEnvelope<unknown> | null, fallback: string): string =>
  payload?.error?.message ?? fallback;

export interface SignUpResult {
  error: string | null;
  /** null nếu backend không auto-login sau đăng ký (edge case) */
  session: Session | null;
}

export interface SignInResult {
  error: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (values: RegisterInput) => Promise<SignUpResult>;
  signIn: (values: LoginInput) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (values: RegisterInput): Promise<SignUpResult> => {
    // Đăng ký qua backend: tạo auth.users + đồng bộ public."User" trong 1 request.
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          phone: values.phone,
          password: values.password,
          role: values.role,
        }),
      });
      const payload = (await res.json()) as ApiEnvelope<{
        access_token?: string;
        refresh_token?: string;
        message?: string;
      }>;
      if (!res.ok) {
        return { error: readError(payload, "Đăng ký thất bại"), session: null };
      }
      if (payload.data?.access_token && payload.data.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: payload.data.access_token,
          refresh_token: payload.data.refresh_token,
        });
        return { error: error?.message ?? null, session: data.session };
      }
      // Đăng ký OK nhưng không auto-login (edge) -> coi như cần đăng nhập
      return { error: null, session: null };
    } catch {
      return { error: "Không thể kết nối máy chủ xác thực", session: null };
    }
  };

  const signIn = async (values: LoginInput): Promise<SignInResult> => {
    // Đăng nhập qua backend (xử lý cả email & SĐT), trả token rồi setSession.
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: values.identifier, password: values.password }),
      });
      const payload = (await res.json()) as ApiEnvelope<{
        access_token?: string;
        refresh_token?: string;
      }>;
      if (!res.ok) {
        return { error: readError(payload, "Đăng nhập thất bại") };
      }
      if (!payload.data?.access_token || !payload.data.refresh_token) {
        return { error: "Máy chủ không trả về phiên đăng nhập" };
      }
      const { error } = await supabase.auth.setSession({
        access_token: payload.data.access_token,
        refresh_token: payload.data.refresh_token,
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: "Không thể kết nối máy chủ xác thực" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
