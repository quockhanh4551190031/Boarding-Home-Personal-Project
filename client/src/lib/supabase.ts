import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY trong client/.env — auth sẽ không hoạt động cho tới khi bạn điền key thật."
  );
}

// Fallback giá trị rỗng để createClient không throw lúc build; auth thực tế cần key thật.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://uqhekuahmufxaxvspnix.supabase.co",
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaGVrdWFobXVmeGF4dnNwbml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkxMjIyOCwiZXhwIjoyMTAxNDg4MjI4fQ.2lqBAJ8sacol5Fan-OLrOKJ8aMyQnYIf5x-63asXUmY",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
