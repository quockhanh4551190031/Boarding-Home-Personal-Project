import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { LoginInput, RegisterInput } from "shared/schemas/auth.schema";
import { getMe, type UserProfile } from "../users/userService";
import { ApiCallError } from "../../lib/api";

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
  /** Hồ sơ public."User" — null khi chưa đăng nhập hoặc fetch lỗi */
  profile: UserProfile | null;
  /** true trong khi đang khôi phục session + fetch profile lần đầu */
  loading: boolean;
  /** Cờ phụ để ProtectedRoute biết khi nào profile đã fetch xong (tránh redirect loop) */
  profileReady: boolean;
  signUp: (values: RegisterInput) => Promise<SignUpResult>;
  signIn: (values: LoginInput) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** Fetch lại profile từ server (gọi sau khi PATCH /api/users/me) */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);

  // Fetch profile từ server — tách hàm để dùng lại sau PATCH.
  const fetchProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    try {
      const p = await getMe();
      setProfile(p);
    } catch (error) {
      // 404 USER_NOT_FOUND = user chưa được đồng bộ sang public."User" (edge case).
      // Vẫn set profileReady=true để ProtectedRoute không kẹt spinner.
      setProfile(null);
      if (!(error instanceof ApiCallError) || error.code !== "USER_NOT_FOUND") {
        console.warn("[auth] fetch profile failed:", error);
      }
    } finally {
      setProfileReady(true);
    }
  }, []);

  // Khôi phục session lúc đầu.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      void fetchProfile(data.session);
    });
    return () => {
      active = false;
    };
  }, [fetchProfile]);

  // Lắng nghe thay đổi session (login, logout, refresh).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      // Reset cờ ready khi session thay đổi — chờ fetch profile mới.
      setProfileReady(false);
      void fetchProfile(nextSession);
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile(session);
  }, [fetchProfile, session]);

  const signUp = async (values: RegisterInput): Promise<SignUpResult> => {
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
      return { error: null, session: null };
    } catch {
      return { error: "Không thể kết nối máy chủ xác thực", session: null };
    }
  };

  const signIn = async (values: LoginInput): Promise<SignInResult> => {
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
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        profileReady,
        signUp,
        signIn,
        signOut,
        refreshProfile,
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
