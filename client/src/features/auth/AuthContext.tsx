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

const API_URL = import.meta.env.VITE_API_URL;

export interface SignUpResult {
  error: string | null;
  /** null khi Supabase bật xác nhận email (cần check mail trước khi có session) */
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
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          phone: values.phone,
          role: values.role,
        },
      },
    });
    return { error: error?.message ?? null, session: data.session };
  };

  const signIn = async (values: LoginInput): Promise<SignInResult> => {
    const isEmail = values.identifier.includes("@");

    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.identifier,
        password: values.password,
      });
      return { error: error?.message ?? null };
    }

    // Phone login: backend tìm email theo SĐT (service role) rồi GoTrue password grant.
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.identifier, password: values.password }),
      });
      const payload = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        error?: string;
      };
      if (!res.ok) {
        return { error: payload.error ?? "Đăng nhập thất bại" };
      }
      const { error } = await supabase.auth.setSession({
        access_token: payload.access_token!,
        refresh_token: payload.refresh_token!,
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
