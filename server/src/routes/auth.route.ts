import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

export const authRouter = Router();

// POST /api/auth/login  { phone, password }
// Supabase Auth native không hỗ trợ phone+password, nên backend dùng Service Role
// để tìm email theo SĐT rồi gọi GoTrue password grant -> trả access/refresh token.
// Frontend gọi supabase.auth.setSession(...) với token này.
authRouter.post("/login", async (req: Request, res: Response) => {
  const { phone, password } = (req.body ?? {}) as {
    phone?: string;
    password?: string;
  };

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      error: "Thiếu số điện thoại hoặc mật khẩu",
    });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: "Supabase chưa được cấu hình (thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    });
  }

  const email = await findEmailByPhone(phone);
  if (!email) {
    return res.status(401).json({ success: false, error: "Số điện thoại chưa được đăng ký" });
  }

  const tokenUrl = `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  try {
    const resp = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = (await resp.json()) as {
      access_token?: string;
      refresh_token?: string;
      error_description?: string;
      msg?: string;
    };

    if (!resp.ok || !data.access_token) {
      return res.status(401).json({
        success: false,
        error: data.error_description ?? data.msg ?? "Sai mật khẩu",
      });
    }

    return res.json({
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  } catch {
    return res.status(502).json({ success: false, error: "Lỗi kết nối Supabase Auth" });
  }
});

async function findEmailByPhone(phone: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  let page = 1;
  const perPage = 200;
  // auth.users không index theo phone -> duyệt trang lọc theo user_metadata.phone.
  // Với MVP (ít user) chấp nhận được; sau này có thể query public."User" (task 1.8 sync).
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const found = data.users.find((u) => (u.user_metadata?.phone as string | undefined) === phone);
    if (found?.email) return found.email;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}
