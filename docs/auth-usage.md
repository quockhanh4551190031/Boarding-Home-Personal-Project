# HƯỚNG DẪN SỬ DỤNG — Auth Backend (Task 1.8)

Tài liệu cách dùng các chức năng vừa thêm: **JWT middleware**, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/sync`.

---

## 1. Chuẩn bị môi trường

### `server/.env` (local, đã có sẵn — điền giá trị thật)

```env
SUPABASE_URL=https://<project-ref>.supabase.co        # BẮT BUỘC (dùng cho JWKS verify token)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>          # chỉ dùng backend (admin API)
DATABASE_URL=postgresql://postgres.<ref>:[pw]@aws-0-<region>.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[pw]@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_WEBHOOK_SECRET=                              # tuỳ chọn; để trống = /api/auth/sync bị tắt (503)

# ❌ SUPABASE_JWT_SECRET không còn dùng nữa:
# Supabase GoTrue mặc định ký JWT bằng ES256 (asymmetric) và publish public key qua JWKS.
# Middleware tự fetch JWKS từ {SUPABASE_URL}/auth/v1/.well-known/jwks.json và verify bằng jose.
# Có thể xoá khỏi .env và Vercel nếu muốn.
```

### Vercel (Production/Preview)

Vào **Project → Settings → Environment Variables**, thêm đúng 5 biến trên (riêng `SUPABASE_WEBHOOK_SECRET` có thể bỏ qua).
Package Manager phải là **pnpm**.

> Sửa `.env` chỉ ảnh hưởng máy local. Deploy lên Vercel **phải** set lại từng biến trong Settings, rồi Redeploy.

### Cách lấy connection string (đang lỗi `tenant/user ... not found`)

1. Supabase Dashboard → chọn project → **Connect** (góc trên) hoặc **Project Settings → Database**.
2. Mục **Connection string** → chọn tab:
   - **Transaction pooler** (port **6543**) → dùng cho `DATABASE_URL` (app query qua Prisma).
   - **Direct connection** (port **5432**) → dùng cho `DIRECT_URL` (chỉ để migrate).  
     *Nếu mạng không hỗ trợ IPv6, bắt buộc dùng pooler (6543).*
3. Copy chuỗi dạng URI, thay `[YOUR-PASSWORD]` bằng mật khẩu DB:

```env
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

4. Quên mật khẩu → **Project Settings → Database → Reset database password**.
5. Cập nhật vào **`server/.env`** (local) và **Vercel → Settings → Environment Variables** (deploy).
6. **Restart server** — `dotenv` chỉ đọc `.env` lúc khởi động, nên đổi xong phải tắt và chạy lại `pnpm --filter server run dev`.

### Thứ tự kiểm tra DB (làm đúng thứ tự này)

```bash
# BƯỚC 1 — tạo bảng trên Supabase, phải chạy xanh
pnpm --filter server exec prisma migrate deploy
```

```bash
# BƯỚC 2 — restart server để đọc DATABASE_URL mới
pnpm --filter server run dev
```

```bash
# BƯỚC 3 — đăng ký 1 tài khoản thật để lấy token (đây chính là test luồng Task 1.8)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test01@gmail.com","phone":"0901234567","password":"12345678","role":"TENANT"}'
```

```bash
# BƯỚC 4 — gọi route có bảo vệ bằng token vừa nhận
curl http://localhost:3001/api/auth/me -H "Authorization: Bearer <access_token>"
```

**Đọc kết quả (bước 3 & 4):**

| Kết quả | Ý nghĩa |
|---|---|
| Bước 3 trả **201** + `access_token` | ✅ DB đã thông, đã ghi được cả `auth.users` và `public."User"` |
| Bước 3 trả **500** | ❌ Connection string vẫn sai, hoặc chưa chạy `migrate deploy` |
| Bước 3 trả **409** `USER_EXISTS`/`EMAIL_EXISTS` | ✅ DB đã thông (chỉ là trùng dữ liệu) — gọi `/login` để lấy token |
| Bước 4 trả **200** + hồ sơ | ✅ Hoàn chỉnh: DB thông + middleware verify token OK |
| Bước 4 trả **404** `USER_NOT_FOUND` | ⚠️ DB thông + bảng tồn tại, nhưng token này chưa có trong `public."User"` |
| Bước 4 trả **401** `UNAUTHORIZED` / `INVALID_TOKEN` | ⚠️ Lỗi token (thiếu header / sai `SUPABASE_URL` dẫn đến không fetch được JWKS) — **không liên quan DB** |

> Lưu ý: `404 USER_NOT_FOUND` chỉ có ý nghĩa khi **bảng đã được tạo** (tức là sau `migrate deploy`). Nếu chưa chạy migrate, Prisma ném `P2021 table does not exist` và bạn vẫn nhận **500** — đừng tưởng nhầm là sai connection string.

### Lệnh hay dùng

```bash
pnpm --filter server run dev          # chạy API local ở http://localhost:3001
pnpm --filter server run typecheck    # kiểm tra type
pnpm --filter server exec prisma generate   # sau mỗi lần đổi schema.prisma
pnpm --filter server exec prisma migrate deploy  # apply migration lên DB
```



---

## 2. Các endpoint

| Method | URL                  | Auth           | Mục đích                                                                |
| ------ | -------------------- | -------------- | ----------------------------------------------------------------------- |
| POST   | `/api/auth/register` | –              | Tạo `auth.users` + đồng bộ `public."User"`, trả luôn token (auto-login) |
| POST   | `/api/auth/login`    | –              | Đăng nhập bằng **email hoặc SĐT**                                       |
| GET    | `/api/auth/me`       | JWT            | Route mẫu: trả hồ sơ người dùng                                         |
| POST   | `/api/auth/sync`     | Webhook secret | Supabase DB Webhook: INSERT `auth.users` → tạo `public."User"`          |
| GET    | `/api/ping`          | –              | Health check                                                            |

**Envelope chuẩn:** thành công `{ "success": true, "data": {...} }`; lỗi `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] } }`.

---

## 3. Gọi thử bằng curl

### 3.1 Đăng ký

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nguyen@gmail.com","phone":"0901234567","password":"12345678","role":"TENANT"}'
```

- 201 → `{ "success": true, "data": { "access_token": "...", "refresh_token": "..." } }`
- 409 `EMAIL_EXISTS` / `USER_EXISTS` — email hoặc SĐT đã có (backend tự rollback `auth.users` nếu ghi `public."User"` lỗi)
- 400 `VALIDATION_ERROR` — body sai, xem `error.details[].field`

### 3.2 Đăng nhập (email hoặc SĐT đều được)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"0901234567","password":"12345678"}'
```

Trả `{ success: true, data: { access_token, refresh_token } }`; sai thông tin → 401 `INVALID_CREDENTIALS`.

### 3.3 Lấy hồ sơ (cần JWT)

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

```json
{ "success": true, "data": { "id": "...", "email": "...", "phone": "...", "fullName": null, "role": "TENANT", "isProfileComplete": false } }
```

- Không có header → 401 `UNAUTHORIZED`
- Token sai/hết hạn → 401 `INVALID_TOKEN`

### 3.4 Đồng bộ qua webhook (tuỳ chọn)

```bash
curl -X POST http://localhost:3001/api/auth/sync \
  -H "Content-Type: application/json" \
  -H "x-supabase-webhook-secret: <SUPABASE_WEBHOOK_SECRET>" \
  -d '{"type":"INSERT","record":{"id":"<uuid>","email":"a@b.com","raw_user_meta_data":{"phone":"0901234567","role":"TENANT"}}}'
```

Chưa set secret → 503 `WEBHOOK_DISABLED`; sai secret → 401 `INVALID_WEBHOOK_SECRET`.

---

## 4. Dùng trên Frontend (đã nối sẵn)

`AuthContext` đã gọi `/register` và `/login` qua backend, rồi `supabase.auth.setSession(...)` để có session chuẩn của Supabase. Bạn **không cần gọi thủ công** trong màn Login/Register.

Khi cần gọi API backend có bảo vệ:

```ts
import { supabase } from "../../lib/supabase";

const { data } = await supabase.auth.getSession();
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
  headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
});
```

> `VITE_API_URL` để trống trên Vercel (same-origin); local dev set `http://localhost:3001`.

---

## 5. Bảo vệ route mới ở backend

```ts
import { requireAuth } from "../middlewares/auth.middleware.js";

router.get("/posts", requireAuth, async (req, res, next) => {
  const userId = req.user!.id;      // id = auth.users.id = public."User".id
  const role = req.user?.role;      // TENANT | LANDLORD | ADMIN (từ user_metadata)
  ...
});
```

Luật hiện tại:

- **Chỉ verify chữ ký & hạn token**, chưa phân quyền theo role. Muốn giới hạn role, thêm middleware `requireRole("LANDLORD")` sau này (nằm ngoài Task 1.8).
- Middleware fetch JWKS từ `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (1 lần, cache lại); verify bằng `jose` với `algorithms: ["ES256"]`, `audience: "authenticated"`. Hoàn toàn local sau khi fetch JWKS.
- `role` đọc từ `user_metadata` — nếu đổi role thì phải cập nhật metadata hoặc ưu tiên đọc từ bảng `User` (khuyến nghị ở các task sau).
- Token Supabase mặc định sống **1 giờ**; `supabase-js` trên FE tự refresh. Backend không cần làm gì.

---

## 6. Setup Supabase DB Webhook (chỉ khi dùng `/sync`)

### `SUPABASE_WEBHOOK_SECRET` lấy ở đâu?

**Không có sẵn trên Supabase — bạn tự tạo một chuỗi bí mật**, rồi dùng **chính chuỗi đó ở 2 nơi** (backend để so sánh, webhook để gửi lên). Chọn 1 cách sinh:

```bash
# Git Bash / macOS / Linux
openssl rand -hex 32

# Node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```powershell
# PowerShell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Chuỗi nhận được (64 ký tự hex) dán vào `server/.env`:

```env
SUPABASE_WEBHOOK_SECRET=8f3c...your64hexchars...
```

### Các bước

1. Dán secret vừa tạo vào `server/.env` **và** Vercel → Settings → Environment Variables → Redeploy.
2. Supabase Dashboard → **Database → Webhooks** (hoặc **Integrations → Webhooks**) → *Create a new hook*:
   - Name: `sync-user`
   - **Table: chọn `auth.users`** (do Supabase Auth quản lý — **KHÔNG chọn `public."User"`** vì bảng này không tự sinh row, đặt webhook ở đây sẽ không bao giờ fire)
   - **Events: chỉ tick `Insert`** (bỏ Update / Delete)
   - Method: `POST`, URL: `https://<domain-của-bạn>/api/auth/sync`
   - HTTP Headers → Add: `x-supabase-webhook-secret` = **cùng chuỗi ở bước 1**
3. Test: tạo user trong **Authentication → Users → Add user** → record phải xuất hiện trong `public."User"`.
4. Log backend sẽ báo `401 INVALID_WEBHOOK_SECRET` nếu 2 bên không khớp (nhớ restart server sau khi sửa `.env`).

> Với luồng hiện tại (`/register` đã đồng bộ trực tiếp), webhook này chỉ cần khi user được tạo ngoài luồng register (OAuth, tạo tay trong dashboard).

### ⚠️ Có thể bỏ qua hoàn toàn

Nếu Supabase báo `ERROR: 3F000 schema "supabase_functions" does not exist` — nghĩa là hạ tầng webhook của project chưa được khởi tạo. Cứ **bỏ qua bước này**, mọi thứ vẫn chạy vì `/register` đã tự ghi cả 2 bảng. Chỉ quay lại khi bật OAuth hoặc có user tạo ngoài luồng register.

- Khi đó: thử `SQL Editor → create schema if not exists supabase_functions;` rồi tạo lại webhook.
- Hoặc dùng Postgres trigger + extension `pg_net` (cần Supabase Pro) — xem snippet trong nhật ký 2026-09-08.

---

## 7. Lỗi thường gặp

| Hiện tượng                                                   | Nguyên nhân                                                                         | Cách xử lý                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| 500 `AUTH_NOT_CONFIGURED`                                    | Thiếu `SUPABASE_URL` (cho JWKS) hoặc `SUPABASE_SERVICE_ROLE_KEY`                    | Điền env, restart server                     |
| 401 `INVALID_TOKEN`                                          | Token sai, hết hạn, hoặc BE không fetch được JWKS từ `SUPABASE_URL`                | Kiểm tra mạng ra ngoài tới Supabase          |
| 500 kèm log `XX000 ... tenant/user postgres.<ref> not found` | `DATABASE_URL` sai project ref hoặc project bị pause                                | Cập nhật lại connection string (pooler 6543) |
| 400 `VALIDATION_ERROR`                                       | Sai định dạng email/SĐT (SĐT: `0xxxxxxxxx` hoặc `+84xxxxxxxxx`), mật khẩu < 8 ký tự | Xem `error.details`                          |
| 503 `WEBHOOK_DISABLED`                                       | Chưa set `SUPABASE_WEBHOOK_SECRET`                                                  | Set nếu cần dùng webhook,否则 bỏ qua           |

---

## 10. Test bằng Postman

### Bước 1 — Tạo Environment
Postman → **Environments** → Create:
| Variable | Initial Value | Current Value |
|---|---|---|
| `base_url` | `http://localhost:3001` | (giữ nguyên) |
| `token` | (để trống) | (sẽ được set bằng script) |

Chọn environment mới tạo làm active (góc trên phải Postman).

### Bước 2 — 3 request

**Request 1: Đăng nhập (lấy token)**
- Method: `POST` → URL: `{{base_url}}/api/auth/login`
- Tab **Body** → `raw` → `JSON`:
  ```json
  { "identifier": "khanh@gmail.com", "password": "12345678" }
  ```
- **Send** → response 200, copy `data.access_token` (chuỗi JWT dài bắt đầu bằng `eyJ...`).

**Tự động lưu token vào env** (làm từ lần thứ 2 trở đi):
Tab **Tests** của Request 1, thêm:
```js
const json = pm.response.json();
if (json.data?.access_token) {
  pm.environment.set("token", json.data.access_token);
  console.log("Token saved:", json.data.access_token.slice(0, 20) + "...");
}
```

**Request 2: Lấy hồ sơ (cần token)**
- Method: `GET` → URL: `{{base_url}}/api/auth/me`
- Tab **Headers** → thêm:
  - `Authorization: Bearer {{token}}`
- **Send** → response 200 + JSON hồ sơ `{id, email, phone, fullName, role, isProfileComplete}`.

**Request 3: Đăng ký user mới (test luồng tạo)**
- Method: `POST` → URL: `{{base_url}}/api/auth/register`
- Body (JSON):
  ```json
  { "email": "postman@test.com", "phone": "0901234567", "password": "12345678", "role": "TENANT" }
  ```
- 201 → kèm `data.access_token` + `data.refresh_token`. Sau đó vào Supabase → Table Editor → `User` thấy row mới.

### Bước 3 — Verify nhanh token có dùng được không
Copy `access_token` ở Response → vào trang https://jwt.io → dán vào ô "Encoded" → trang sẽ giải mã ra payload gồm `sub` (id user), `email`, `user_metadata` (chứa `phone` và `role`), `exp` (thời điểm hết hạn). Nếu payload hiện ra đúng thông tin user thì token thật, không phải mock.

> Token Supabase mặc định sống **1 giờ**; gọi lại Request 1 để lấy token mới khi hết hạn.

---

## 8. Checklist nghiệm thu (DoD Task 1.8)

- [ ] Đăng ký 1 tài khoản từ FE → xuất hiện record trong **cả** `auth.users` và `public."User"`
- [ ] Đăng nhập bằng SĐT thành công
- [ ] Gọi `/api/auth/me` có token → trả đúng hồ sơ
- [ ] Gọi `/api/auth/me` không token → 401
