# PHÂN RÃ CÔNG VIỆC CHI TIẾT — SPRINT 1
**Sprint 1: Nền tảng & Xác thực**
**Vai trò hướng dẫn:** Senior Software Engineer

Dưới đây là bản phân rã các công việc của Sprint 1 thành các task nhỏ (1-3 giờ/task), được sắp xếp theo đúng thứ tự tuyến tính (Linear Dependencies). Bạn không được nhảy cóc các task này.

---

## Task 1.1: Thiết kế UI/UX Core (Wireframe)
**Mục tiêu:** Định hình giao diện trước khi bắt đầu code Frontend để tránh việc vừa code vừa nghĩ layout. (Thời lượng: ~3h)
**Kiến thức cần học:** Sử dụng Figma cơ bản, Component-based design.
**Các bước thực hiện:**
1. Tham khảo UI của một số trang tìm trọ/mạng xã hội hiện có.
2. Vẽ wireframe (khung xương) cho trang: Login, Register, Hoàn thiện hồ sơ.
3. Chốt bảng màu (Primary color) và Font chữ.
**Tài liệu liên quan:** Project Plan V2 (Mục 9 - Danh sách trang).
**Output:** File thiết kế Figma.
**Definition of Done:** Có thiết kế cho cả Mobile và Desktop của 3 trang Auth.
**Sai lầm thường gặp:** Vẽ quá chi tiết (Shadow, gradients) làm tốn thời gian. Ở giai đoạn này chỉ cần Wireframe/Low-fidelity là đủ.
**Checklist:**
- [ ] Đã có giao diện Login.
- [ ] Đã có giao diện chọn Role khi Register.

---

## Task 1.2: Khởi tạo Project & Cấu trúc Monorepo
**Mục tiêu:** Tạo nền móng repository chuẩn với pnpm workspace. (Thời lượng: ~2h)
**Kiến thức cần học:** Cấu hình `pnpm-workspace.yaml`, Vite, Express cơ bản.
**Các bước thực hiện:**
1. Khởi tạo Git repo.
2. Tạo cấu trúc monorepo với 3 folder: `client` (React+Vite), `server` (Express+TS), `shared`.
3. Cấu hình ESLint và Prettier cho toàn project.
4. Cài đặt TailwindCSS và shadcn/ui cho `client`.
**Tài liệu liên quan:** Architecture Document (Mục 3 - Folder Structure).
**Output:** Source code base trên GitHub.
**Definition of Done:** Chạy lệnh `pnpm dev` thì Frontend hiện trang trắng ở cổng 5173 và Backend in ra log "Server running" ở cổng 3001.
**Sai lầm thường gặp:** Cài sai version Node.js/pnpm dẫn đến xung đột package.
**Checklist:**
- [ ] Các thư mục đã đúng cấu trúc Architecture.
- [ ] ESLint không báo lỗi.
- [ ] Commit đầu tiên "Initial commit" thành công.

---

## Task 1.3: Cài đặt Supabase & Khởi tạo Database Schema
**Mục tiêu:** Setup hạ tầng Database trên cloud và tạo bảng User đầu tiên. (Thời lượng: ~2h)
**Kiến thức cần học:** Supabase Dashboard, Prisma ORM (init, migrate).
**Các bước thực hiện:**
1. Tạo project trên Supabase (lưu lại URL và các Keys vào `.env`).
2. Cài đặt Prisma vào thư mục `server`.
3. Viết schema cho model `User` trong `schema.prisma`.
4. Chạy `prisma migrate dev` để đẩy schema lên Supabase.
**Tài liệu liên quan:** Database Spec (Mục 3.1 - Bảng User).
**Output:** Database Postgres có bảng User trên Supabase.
**Definition of Done:** Bảng `User` xuất hiện trên giao diện Supabase Table Editor.
**Sai lầm thường gặp:** Quên đưa file `.env` vào `.gitignore` dẫn đến lộ DB password lên GitHub.
**Checklist:**
- [ ] Đã thiết lập `.env` và `.gitignore`.
- [ ] Bảng User có đủ các trường ID, Email, Phone, Role.

---

## Task 1.4: Cấu hình Vercel & CI/CD Pipeline
**Mục tiêu:** Đảm bảo source code có thể tự động deploy lên mây mỗi khi Push code. (Thời lượng: ~1.5h)
**Kiến thức cần học:** GitHub Actions cơ bản, Vercel Serverless config (`vercel.json`).
**Các bước thực hiện:**
1. Viết file `.github/workflows/ci.yml` chạy lint và type-check.
2. Link repo với Vercel.
3. Cấu hình Vercel nhận diện Monorepo (Root directory, Build command).
4. Thêm Environment Variables vào Vercel Settings.
**Tài liệu liên quan:** Architecture Document (Overall Architecture).
**Output:** Link preview của Vercel hoạt động.
**Definition of Done:** Push code lên nhánh `main`, Vercel tự động build thành công.
**Sai lầm thường gặp:** Frontend gọi API backend bằng `localhost` thay vì biến môi trường (VITE_API_URL).
**Checklist:**
- [ ] Action chạy xanh (Passed) trên GitHub.
- [ ] Vercel hiển thị trang trắng (không lỗi 500).

---

## Task 1.5: Xây dựng Core Backend (Middlewares & Utils)
**Mục tiêu:** Xây dựng phần lõi kiến trúc để các API sau này tái sử dụng (Fail-fast principle). (Thời lượng: ~3h)
**Kiến thức cần học:** Express Middleware, Zod Validation, Pino Logging, Custom Error Handler.
**Các bước thực hiện:**
1. Viết class `AppError`.
2. Viết Global Error Handler Middleware (`error.middleware.ts`).
3. Setup thư viện `pino` và Request ID middleware.
4. Viết Validation Middleware dùng Zod (`validate.middleware.ts`).
**Tài liệu liên quan:** Architecture (Mục 6, 9, 10 - Middleware/Error/Log Flow).
**Output:** 4 file middleware & utils.
**Definition of Done:** Viết 1 API `/api/ping` test thử: ném lỗi bằng `AppError` thì postman nhận đúng JSON format báo lỗi.
**Sai lầm thường gặp:** Quên đặt Error Middleware ở dòng code cuối cùng (sau tất cả các route).
**Checklist:**
- [ ] Bắn lỗi có cấu trúc chuẩn `{ success: false, error: {...} }`.
- [ ] Log có in ra RequestID.

---

## Task 1.6: Xây dựng UI Đăng nhập/Đăng ký (Frontend)
**Mục tiêu:** Chuyển đổi Figma thành Component React. (Thời lượng: ~2h)
**Kiến thức cần học:** React Hook Form, Zod integration.
**Các bước thực hiện:**
1. Tạo shared Zod Schema cho `auth.schema.ts` (nằm ở thư mục `shared/schemas`).
2. Dựng form Login và form Register bằng React Hook Form + shadcn/ui.
3. Xử lý validation trực tiếp trên UI (ví dụ báo đỏ nếu email sai định dạng).
**Tài liệu liên quan:** Architecture (Thư mục shared).
**Output:** 2 Component Form hoạt động.
**Definition of Done:** Bấm "Submit" với data rỗng sẽ hiện thông báo lỗi ngay dưới các ô input (không gọi API).
**Sai lầm thường gặp:** Cố gắng gọi API ngay lúc này. Chỉ nên test UI và Validation trước.
**Checklist:**
- [ ] React Hook Form nhận đúng Type từ Zod Schema.
- [ ] Layout responsive (không tràn màn hình mobile).

---

## Task 1.7: Tích hợp Supabase Auth (Frontend)
**Mục tiêu:** Kết nối UI với dịch vụ Auth của Supabase. (Thời lượng: ~2.5h)
**Kiến thức cần học:** `@supabase/supabase-js`, React Context (AuthContext).
**Các bước thực hiện:**
1. Khởi tạo Supabase client.
2. Viết hàm `signUp` và `signIn` gọi SDK Supabase.
3. Tạo `AuthContext` để lưu trạng thái đăng nhập (User Object + Session).
4. Gắn các hàm này vào nút Submit của UI vừa tạo ở Task 1.6.
**Tài liệu liên quan:** Architecture (Mục 7 - Auth Flow).
**Output:** User có thể đăng ký tài khoản thành công.
**Definition of Done:** Sau khi đăng ký, có record xuất hiện trong bảng `auth.users` của Supabase (lưu ý: chưa có trong bảng `public."User"`).
**Sai lầm thường gặp:** Lưu nhầm Supabase Secret Key ở Frontend. (Chỉ dùng ANON_KEY ở FE).
**Checklist:**
- [ ] FE gửi req đăng ký thành công.
- [ ] FE nhận được Access Token (JWT).

---

## Task 1.8: Webhook Đồng bộ User & Auth Middleware (Backend)
**Mục tiêu:** Hoàn thiện vế Backend của cơ chế Auth. (Thời lượng: ~3h)
**Kiến thức cần học:** Postgres Webhook / Trigger, JWT Verification.
**Các bước thực hiện:**
1. Backend: Viết API `POST /api/auth/sync` lưu thông tin vào bảng `User` bằng Prisma.
2. Supabase: Setup Webhook (hoặc DB Trigger) gọi vào API trên mỗi khi có người đăng ký mới.
3. Backend: Viết `auth.middleware.ts` sử dụng `jsonwebtoken` để verify Access Token.
**Tài liệu liên quan:** API Spec (Mục 1.1), Architecture (Mục 7).
**Output:** User đồng bộ hoàn toàn, API bảo mật được bằng Token.
**Definition of Done:** 
- Đăng ký 1 nick mới bên FE $\rightarrow$ Kiểm tra bảng `public."User"` thấy có record tương ứng.
- Gọi 1 API test có kẹp JWT $\rightarrow$ backend giải mã và in ra được `req.user.id`.
**Sai lầm thường gặp:** API Sync User không được bảo vệ (bất kỳ ai gọi cũng tạo được user giả). Cần setup header Secret để Backend kiểm chứng request này đến từ Supabase.
**Checklist:**
- [ ] User mới đồng bộ thành công.
- [ ] Middleware auth chặn đứng request không có token trả về 401.

---

## Task 1.9: API và UI Hoàn thiện hồ sơ
**Mục tiêu:** Đảm bảo User cập nhật đủ thông tin liên lạc (cần thiết để thuê trọ). (Thời lượng: ~2.5h)
**Kiến thức cần học:** React Router (Redirect), Prisma (Update query).
**Các bước thực hiện:**
1. Backend: Code API `PATCH /api/users/me` để cập nhật SĐT, Họ tên. Set `isProfileComplete = true`.
2. Frontend: Viết màn hình `/onboarding`.
3. Frontend: Thêm logic vào `AuthContext` hoặc Layout (Nếu login rồi mà `isProfileComplete === false` $\rightarrow$ Tự động văng sang trang `/onboarding`, không cho vào Home).
**Tài liệu liên quan:** API Spec (Mục 2.2).
**Output:** Luồng đăng ký 2 bước khép kín.
**Definition of Done:** Sau khi đăng ký thành công, FE tự đẩy qua màn hình nhập SĐT. Nhập xong, bấm lưu thành công, FE cho phép vào trang chủ.
**Sai lầm thường gặp:** Vòng lặp vô tận (Infinite Redirect Loop) ở Frontend khi cấu hình sai điều kiện nhảy trang.
**Checklist:**
- [ ] Dữ liệu update đúng xuống bảng `User`.
- [ ] Không thể bỏ qua màn hình Onboarding bằng cách sửa URL.
