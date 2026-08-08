# HƯỚNG DẪN LẬP TRÌNH — SPRINT 1 (DEVELOPMENT GUIDE)

**Sprint 1: Nền tảng & Xác thực**
**Đối tượng sử dụng:** Lập trình viên trực tiếp triển khai code.

Tài liệu này không chứa code (để bạn tự tay rèn luyện), nhưng cung cấp cho bạn một lộ trình chi tiết đến từng file để biết chính xác nên bắt đầu từ đâu, tạo file gì, và kết nối chúng thế nào.

---

## Task 1.1: Thiết kế UI/UX Core (Wireframe)
**Mục tiêu:** Định hình layout cho cụm tính năng Xác thực.
**Kiến thức nền:** Nguyên lý UX cho form đăng nhập/đăng ký (chọn role), Figma cơ bản.
**Các file sẽ được tạo/chỉnh sửa:** Không có file code, chỉ có file thiết kế (`.fig`).
**Thứ tự triển khai:**
1. Tham khảo các UI form chuẩn trên Dribbble / Mobbin.
2. Thiết kế màn hình Login (Email, Password).
3. Thiết kế màn hình Register (Email, Password, Role Radio Buttons).
4. Thiết kế màn hình Onboarding (Cập nhật SĐT, Họ tên).
**Best Practices:**
- Thiết kế theo nguyên lý **Mobile-First** vì người tìm trọ đa phần dùng điện thoại.
- Form càng ít trường (fields) càng tốt để giảm tỉ lệ rớt người dùng (Drop-off rate).

---

## Task 1.2: Khởi tạo Project & Cấu trúc Monorepo
**Mục tiêu:** Setup môi trường chuẩn xác cho cả Frontend và Backend chạy song song.
**Kiến thức nền:** pnpm workspaces, Vite, cấu trúc dự án Node.js.
**Các file sẽ được tạo:**
- Root: `package.json`, `pnpm-workspace.yaml`, `.gitignore`.
- Thư mục `client/`: Khởi tạo bằng lệnh `npm create vite@latest client --template react-ts`.
- Thư mục `server/`: Khởi tạo bằng `npm init -y` và thiết lập TypeScript (`tsconfig.json`).
- Thư mục `shared/`: Chứa file `package.json` trống để cấu hình workspace.
**Các file sẽ được chỉnh sửa:**
- `package.json` ở Root: Cấu hình các lệnh chạy đồng thời (dùng `concurrently` hoặc `npm-run-all`) như `pnpm dev` để khởi động cả client và server.
**Quan hệ giữa các file:** `client` và `server` hoạt động độc lập nhưng có thể import trực tiếp các module từ `shared` (sau khi setup workspace đúng).
**Thứ tự triển khai:** Tạo Root $\rightarrow$ Tạo `pnpm-workspace.yaml` $\rightarrow$ Scaffold `client` $\rightarrow$ Setup `server` $\rightarrow$ Cấu hình scripts.
**Những lỗi phổ biến:** Bị lỗi "Module not found" khi import từ thư mục `shared` do cấu hình `tsconfig.json` chưa chuẩn (chưa khai báo `paths` hoặc references).
**Best Practices:** Đừng nhét chung `node_modules` vào `.gitignore` ở thư mục con, chỉ cần để ở Root là đủ.

---

## Task 1.3: Cài đặt Supabase & Khởi tạo Database Schema
**Mục tiêu:** Tạo bảng `User` bằng Prisma và đẩy lên đám mây.
**Kiến thức nền:** Prisma ORM, SQL migrations, PostgreSQL.
**Các file sẽ được tạo:**
- `server/prisma/schema.prisma`
- Thư mục `server/prisma/migrations/` (được sinh ra tự động)
- `server/.env`
**Quan hệ giữa các file:** File `schema.prisma` lấy thông tin kết nối DB từ file `.env`.
**Thứ tự triển khai:** Cài đặt Prisma $\rightarrow$ Lấy chuỗi kết nối từ Supabase bỏ vào `.env` $\rightarrow$ Định nghĩa Model User $\rightarrow$ Chạy lệnh `npx prisma migrate dev --name init`.
**Những lỗi phổ biến:** 
- Đẩy nhầm file `.env` lên GitHub (Lộ Database Password).
- Dùng `DATABASE_URL` là link IPv6 (Supabase có pooler mode và direct connection mode, với Prisma ở local nên dùng direct connection).
**Best Practices:** Luôn đặt comment rõ ràng vào schema để mô tả các trường, Prisma sẽ dùng thông tin đó làm gợi ý IDE sau này.

---

## Task 1.4: Cấu hình Vercel & CI/CD Pipeline
**Mục tiêu:** Chuẩn hóa quy trình đẩy code lên production.
**Kiến thức nền:** GitHub Actions (YAML), Vercel configurations.
**Các file sẽ được tạo:**
- `.github/workflows/ci.yml`
- Root: `vercel.json` (Cấu hình route cho Serverless Backend)
**Thứ tự triển khai:** Viết action lint/type-check $\rightarrow$ Push code $\rightarrow$ Kết nối repo với Vercel $\rightarrow$ Đẩy biến môi trường (Environment Variables) từ local `.env` lên màn hình cài đặt Vercel.
**Những lỗi phổ biến:** Vercel tự động nhận diện root thư mục sai do đây là kiến trúc Monorepo.
**Best Practices:** Cấu hình Root Directory trên giao diện Vercel trỏ thẳng vào folder `client` để nó tự build Vite mà không cần config phức tạp, đối với Backend thì dùng `vercel.json` định nghĩa các function API.

---

## Task 1.5: Xây dựng Core Backend (Middlewares & Utils)
**Mục tiêu:** Xây dựng hàng rào kiểm duyệt cho toàn bộ API.
**Kiến thức nền:** Express Middleware signature (`req, res, next`), HTTP Status Codes.
**Các file sẽ được tạo:**
- `server/src/utils/AppError.ts`
- `server/src/middlewares/error.middleware.ts`
- `server/src/middlewares/validate.middleware.ts`
- `server/src/utils/logger.ts`
**Các file sẽ được chỉnh sửa:**
- `server/src/app.ts` (Import và sử dụng tất cả middlewares).
**Quan hệ giữa các file:**
- Khi vào hệ thống: Mọi request đi qua `logger` $\rightarrow$ chạy qua `validate.middleware.ts` (nếu sai Zod schema, nó ném `AppError`).
- Ở cuối hệ thống: `error.middleware.ts` hứng `AppError` và trả JSON cho client.
**Thứ tự triển khai:** Logger $\rightarrow$ AppError $\rightarrow$ Error Middleware $\rightarrow$ Validate Middleware $\rightarrow$ Gắn vào `app.ts`.
**Những lỗi phổ biến:** Quên khai báo param thứ 4 `(err, req, res, next)` trong Error Middleware, dẫn đến Express không hiểu đó là middleware xử lý lỗi.
**Best Practices:** Giữ logic error handler càng đơn giản càng tốt, tuyệt đối không được ném (throw) lỗi bên trong error handler (có thể gây sập server).

---

## Task 1.6: Xây dựng UI Đăng nhập/Đăng ký (Frontend)
**Mục tiêu:** Tạo form giao tiếp với người dùng và xác thực dữ liệu ngay tại Browser.
**Kiến thức nền:** React Hook Form (`useForm`), zod resolvers, CSS layout.
**Các file sẽ được tạo:**
- `shared/schemas/auth.schema.ts` (Chứa Zod schema)
- `client/src/features/auth/pages/LoginPage.tsx`
- `client/src/features/auth/pages/RegisterPage.tsx`
- `client/src/features/auth/components/AuthForm.tsx` (Tái sử dụng code)
**Quan hệ giữa các file:** `LoginPage` và `RegisterPage` dùng chung `AuthForm` hoặc dùng chung `auth.schema.ts` để kiểm tra độ dài password/email.
**Thứ tự triển khai:** Tạo Zod Schema $\rightarrow$ Setup React Hook Form $\rightarrow$ Build UI $\rightarrow$ Gắn báo lỗi lên giao diện.
**Những lỗi phổ biến:** Dùng State (`useState`) cho từng trường nhập liệu thay vì dùng `useForm`, làm giảm hiệu năng (re-render nhiều lần).
**Best Practices:** Tách UI components khỏi Business Logic. Form chỉ làm nhiệm vụ nhận Data hợp lệ và truyền ngược lên trang cha qua prop `onSubmit`.

---

## Task 1.7: Tích hợp Supabase Auth (Frontend)
**Mục tiêu:** Đăng nhập người dùng qua cloud.
**Kiến thức nền:** Supabase SDK, React Context API.
**Các file sẽ được tạo:**
- `client/src/lib/supabase.ts` (Khởi tạo client)
- `client/src/contexts/AuthContext.tsx`
**Các file sẽ được chỉnh sửa:**
- `client/src/App.tsx` (Bọc toàn ứng dụng bằng `<AuthProvider>`)
- Các trang Login/Register (gọi hàm từ Context).
**Quan hệ giữa các file:** Component gọi hàm `login()` từ `AuthContext`. `AuthContext` gọi `supabase.auth.signInWithPassword()`.
**Thứ tự triển khai:** Setup SDK $\rightarrow$ Viết Context cung cấp state `user`, hàm `login`, `register`, `logout` $\rightarrow$ Áp dụng vào UI.
**Những lỗi phổ biến:** Không quản lý trạng thái đang loading (isInitializing) khi ứng dụng vừa bật lên khiến màn hình nhấp nháy chuyển từ "Chưa đăng nhập" sang "Đã đăng nhập".
**Best Practices:** Sử dụng `supabase.auth.onAuthStateChange` bên trong useEffect của `AuthContext` để tự động lắng nghe khi phiên (session) thay đổi hoặc hết hạn.

---

## Task 1.8: Webhook Đồng bộ User & Auth Middleware
**Mục tiêu:** Tạo cầu nối giữa Auth (Identity) và User (Business Data).
**Kiến thức nền:** JWT structure, Supabase Webhooks.
**Các file sẽ được tạo:**
- `server/src/routes/auth.routes.ts`
- `server/src/controllers/auth.controller.ts`
- `server/src/middlewares/auth.middleware.ts`
**Các file sẽ được chỉnh sửa:**
- `server/src/app.ts` (Khai báo route mới)
**Quan hệ giữa các file:** 
- Request từ Supabase đi vào Router $\rightarrow$ Controller gọi Prisma để Insert user.
- Request từ Frontend gọi các API khác $\rightarrow$ đi qua `auth.middleware.ts` để verify JWT.
**Thứ tự triển khai:** Viết Controller lưu User (Prisma) $\rightarrow$ Viết Route $\rightarrow$ Cấu hình Supabase Webhook $\rightarrow$ Viết Middleware xác thực token.
**Những lỗi phổ biến:** Để hở endpoint Webhook. Kẻ xấu có thể gọi API này và nhét hàng ngàn user giả vào. Cần kiểm tra HTTP Header (VD: `x-webhook-secret`) để chắc chắn request tới từ Supabase.
**Best Practices:** Đừng cố tự viết code giải mã chữ ký JWT thủ công, hãy sử dụng thư viện `jsonwebtoken` với secret key là `SUPABASE_JWT_SECRET`.

---

## Task 1.9: API và UI Hoàn thiện hồ sơ
**Mục tiêu:** Đảm bảo User có đủ dữ liệu theo thiết kế DB trước khi dùng mạng xã hội.
**Kiến thức nền:** React Router (`<Navigate>`), Express Controller/Service.
**Các file sẽ được tạo:**
- `client/src/features/auth/pages/OnboardingPage.tsx`
- `server/src/routes/user.routes.ts`
- `server/src/controllers/user.controller.ts`
- `server/src/services/user.service.ts`
**Quan hệ giữa các file:** 
- Frontend có một `<ProtectedRoute>` để kiểm tra: `Nếu user != null && user.isProfileComplete === false => Chuyển sang /onboarding`.
- Màn hình Onboarding gọi API Patch thông qua `user.routes.ts` $\rightarrow$ Controller $\rightarrow$ Service (gọi Prisma Update).
**Thứ tự triển khai:** Backend API $\rightarrow$ Frontend UI Form $\rightarrow$ Frontend Router Guard (Logic chuyển hướng).
**Những lỗi phổ biến:** User đang ở `/onboarding`, vừa bấm lưu thành công thì app lại load chậm, user bấm back quay lại $\rightarrow$ Lỗi logic luồng.
**Best Practices:** Đảm bảo API Patch Idempotent (Dù gọi 1 hay nhiều lần cũng chỉ ra 1 kết quả duy nhất). Sau khi API báo thành công, update lại state user trong `AuthContext` để app tự động cho user đi qua trang chủ.
