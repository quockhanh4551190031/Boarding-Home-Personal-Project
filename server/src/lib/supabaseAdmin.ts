import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client dùng Service Role Key — CHỈ dùng ở backend (never đưa lên frontend).
// Dùng để lookup user theo SĐT (auth.admin) và cấp token đăng nhập SĐT.
export const supabaseAdmin: SupabaseClient | null =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
