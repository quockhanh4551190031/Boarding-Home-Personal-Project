import { supabase } from "./supabase";

/**
 * Helper gọi API backend có gắn Bearer token từ Supabase session.
 * Dùng cho mọi request cần auth.
 */

const API_URL = import.meta.env.VITE_API_URL || "";

export interface ApiError {
  code?: string;
  message?: string;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: ApiError;
}

export class ApiCallError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiCallError";
    this.code = code;
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = (await res.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!res.ok) {
    const code = payload?.error?.code ?? "UNKNOWN_ERROR";
    const message = payload?.error?.message ?? `HTTP ${res.status}`;
    throw new ApiCallError(res.status, code, message);
  }

  if (payload && payload.data !== undefined) {
    return payload.data;
  }
  return payload as unknown as T;
}
