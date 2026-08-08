# KẾ HOẠCH ĐỒ ÁN TỐT NGHIỆP — VERSION 2

**Đề tài:** Mạng xã hội tìm phòng trọ
**Phiên bản:** 2.0
**Quy mô:** 1 sinh viên · 13 tuần · ~15 giờ/tuần (~195 giờ tổng)

---

# MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Các quyết định thiết kế đã chốt](#2-các-quyết-định-thiết-kế-đã-chốt)
3. [Tech Stack (chốt cuối)](#3-tech-stack-chốt-cuối)
4. [Kiến trúc hệ thống](#4-kiến-trúc-hệ-thống)
5. [Cấu trúc Project](#5-cấu-trúc-project)
6. [Thiết kế cơ sở dữ liệu](#6-thiết-kế-cơ-sở-dữ-liệu)
7. [Phân tích chức năng chi tiết](#7-phân-tích-chức-năng-chi-tiết)
8. [Cross-Cutting Concerns](#8-cross-cutting-concerns)
9. [Danh sách trang / màn hình](#9-danh-sách-trang--màn-hình)
10. [MVP Definition](#10-mvp-definition)
11. [Lộ trình phát triển 13 tuần](#11-lộ-trình-phát-triển-13-tuần)
12. [Đề xuất mở rộng (nếu còn thời gian)](#12-đề-xuất-mở-rộng-nếu-còn-thời-gian)

---

# 1. TỔNG QUAN DỰ ÁN

## 1.1. Mục tiêu

Xây dựng nền tảng web dạng mạng xã hội, kết nối **người tìm trọ** và **chủ trọ**, với các tính năng chính:

- Định vị tự động, tìm phòng trọ gần vị trí hiện tại
- Chat realtime giữa người tìm trọ và chủ trọ
- Chatbot AI hỗ trợ tìm phòng
- Diễn đàn chia sẻ kinh nghiệm thuê trọ

## 1.2. Phạm vi đồ án (Scope)

### ✅ Trong phạm vi

| # | Tính năng | Mô tả ngắn |
|---|----------|-------------|
| 1 | Đăng ký / Đăng nhập | Email + mật khẩu, chọn role |
| 2 | Hoàn thiện hồ sơ | Bổ sung thông tin cá nhân lần đầu đăng nhập |
| 3 | Quản lý phòng trọ (CRUD) | Chủ trọ tạo/sửa/xoá nhà trọ + phòng trọ |
| 4 | Tìm kiếm + Bộ lọc | Tìm theo vị trí, giá, diện tích, tiện ích |
| 5 | Bản đồ + Định vị tự động | Hiển thị phòng trọ trên bản đồ, sắp xếp theo khoảng cách |
| 6 | Chat 1-1 realtime | Nhắn tin trực tiếp giữa 2 người dùng |
| 7 | Diễn đàn chia sẻ | Đăng bài, bình luận, chia sẻ phòng trọ lên diễn đàn |
| 8 | Chatbot AI | Trả lời FAQ, hướng dẫn dùng web, gợi ý tìm phòng |
| 9 | Admin Dashboard | Quản lý user, bài đăng, report, thống kê cơ bản |
| 10 | Lưu bài yêu thích | Bookmark phòng trọ quan tâm |

### ❌ Ngoài phạm vi (đã cân nhắc và loại bỏ)

| Tính năng bị loại | Lý do loại |
|-------------------|-----------|
| **Video call (WebRTC)** | Rất khó implement đúng (STUN/TURN server, NAT traversal, codec). Cần 2-3 tuần cho 1 tính năng ít dùng. Thay thế bằng nút "Gọi điện" link trực tiếp đến số điện thoại chủ trọ |
| **Chat nhóm / Chat room nhà trọ** | Tăng complexity gấp đôi so với chat 1-1 (quản lý member, quyền, scroll history). Chat 1-1 đủ cho use case chính |
| **AI gợi ý phòng theo lịch sử** | Cần lượng data lớn mới có ý nghĩa. Đồ án demo không có đủ user data để train recommendation |
| **Xác thực CCCD / giấy tờ nhà đất** | Liên quan pháp lý, cần OCR hoặc manual review, vượt scope đồ án cá nhân |
| **Notification push real-time** | Nice-to-have. Thay thế bằng badge đếm tin chưa đọc + polling đơn giản |

## 1.3. Ngân sách & Ràng buộc

| Hạng mục | Chi tiết |
|----------|---------|
| Thời gian | 13 tuần × 15 giờ/tuần ≈ 195 giờ |
| Ngân sách | $0 (toàn bộ free tier) |
| Thành viên | 1 sinh viên |
| Deployment | Vercel (frontend + backend) + Supabase (DB + Auth + Realtime + Storage) |

---

# 2. CÁC QUYẾT ĐỊNH THIẾT KẾ ĐÃ CHỐT

> [!IMPORTANT]
> Những quyết định dưới đây đã được cân nhắc kỹ. Không nên thay đổi trong quá trình phát triển trừ khi có lý do rất đặc biệt.

### QĐ-1: Một tài khoản — một Role cố định

- User chọn role khi đăng ký: **TENANT** (người tìm trọ) hoặc **LANDLORD** (chủ trọ). Không thay đổi sau khi đăng ký.
- **Lý do:** Đơn giản hoá middleware phân quyền, giảm complexity UI (menu khác nhau theo role). Nếu user muốn cả 2 role → tạo 2 tài khoản với 2 email.

### QĐ-2: Supabase Realtime thay cho Socket.io

- Chat realtime sẽ dùng **Supabase Realtime** (Postgres Changes + Broadcast) thay vì Socket.io.
- **Lý do:** Socket.io cần persistent WebSocket connection → không chạy được trên Vercel Serverless. Supabase Realtime nằm sẵn trong Supabase free tier, tương thích 100% với Vercel, không cần server riêng, giảm 1 dependency lớn.
- **Cách hoạt động:**
  - Frontend subscribe channel qua `@supabase/supabase-js` realtime
  - Khi có message mới INSERT vào bảng `messages`, Supabase broadcast tự động đến subscribers
  - Typing indicator dùng Broadcast channel (không persist vào DB)
  - Online/offline status dùng Presence channel

### QĐ-3: Chatbot dùng Gemini API (free tier)

- Dùng Google Gemini API thay vì OpenAI → có free tier (60 request/phút cho Gemini 1.5 Flash).
- **Lý do:** $0 chi phí. OpenAI tính tiền theo token → không phù hợp cho sinh viên.

### QĐ-4: Bài đăng phòng trọ KHÔNG cần Admin duyệt trước

- Bài đăng hiển thị ngay sau khi tạo. Admin chỉ xử lý khi có report vi phạm.
- **Lý do:** Đồ án demo quy mô nhỏ, không có đủ moderator để duyệt trước. Flow duyệt trước sẽ làm chậm trải nghiệm demo.

### QĐ-5: Bán kính tìm kiếm mặc định 5km, user tuỳ chỉnh được

- Mặc định hiển thị phòng trọ trong bán kính 5km quanh vị trí hiện tại.
- User có thể điều chỉnh qua slider (1km → 20km).
- **Lý do:** 5km là khoảng cách hợp lý cho di chuyển trong thành phố. Cho phép tuỳ chỉnh tránh trường hợp khu vực thưa phòng trọ.

### QĐ-6: Monorepo structure

- Frontend và Backend nằm chung 1 repository, tách 2 thư mục `client/` và `server/`.
- **Lý do:** 1 sinh viên quản lý 1 repo dễ hơn 2 repo. Chia sẻ type definitions, Zod schemas giữa FE/BE. Vercel hỗ trợ monorepo deployment.

---

# 3. TECH STACK (CHỐT CUỐI)

| Thành phần | Công nghệ | Lý do chọn |
|-----------|----------|-----------|
| **Frontend** | React (Vite) + TypeScript | Vite build nhanh, HMR tốt. TypeScript giúp catch lỗi sớm |
| **UI Framework** | TailwindCSS + shadcn/ui | Component library đẹp, accessible, customizable. Không cần tự design từ đầu |
| **State Management** | TanStack Query (React Query) | Auto-cache, auto-refetch, loading/error states. Giảm boilerplate so với Redux |
| **Form Management** | React Hook Form + Zod | Performance tốt (uncontrolled), tích hợp Zod validation |
| **Backend** | Node.js + Express + TypeScript | Đồng nhất ngôn ngữ với Frontend. Express mature, nhiều middleware ecosystem |
| **ORM** | Prisma | Type-safe queries, auto-generate types, migration management |
| **Database** | Supabase (Postgres + PostGIS) | Free tier 500MB. PostGIS cho spatial queries. Supabase quản lý infrastructure |
| **Auth** | Supabase Auth | Free tier 50k MAU. Email/password built-in. JWT tự phát hành |
| **Realtime Chat** | Supabase Realtime | Free tier 200 concurrent connections. Tương thích Vercel (client-side subscribe) |
| **File Storage** | Supabase Storage | Free tier 1GB. Tích hợp sẵn với Supabase Auth (RLS policies) |
| **Bản đồ** | Leaflet + OpenStreetMap | Hoàn toàn miễn phí (OSM là open-source). Leaflet nhẹ, docs tốt |
| **Geocoding** | Nominatim (OpenStreetMap) | Miễn phí, không cần API key. Dùng cho reverse geocoding + search autocomplete |
| **Chatbot AI** | Google Gemini API (free tier) | 60 request/phút miễn phí. Đủ cho đồ án demo |
| **Validation** | Zod | Schema-first, infer TypeScript types, dùng chung FE + BE |
| **Logging** | Pino | Structured JSON logging, nhanh hơn Winston, hỗ trợ Vercel |
| **Testing** | Vitest + Supertest | Vitest tương thích Vite, nhanh. Supertest cho API integration tests |
| **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) | Tự generate docs từ JSDoc comments. Hội đồng ấn tượng khi demo |
| **Deploy Frontend** | Vercel | Free tier, auto-deploy từ GitHub, preview deployments |
| **Deploy Backend** | Vercel Serverless Functions | Free tier, cùng project với frontend (monorepo). Tương thích vì đã thay Socket.io bằng Supabase Realtime |
| **Package Manager** | pnpm | Nhanh hơn npm, tiết kiệm disk space (symlinks). Vercel hỗ trợ pnpm |
| **Linting** | ESLint + Prettier | Code style nhất quán. Có thể tích hợp CI/CD |

---

# 4. KIẾN TRÚC HỆ THỐNG

## 4.1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          VERCEL (Free Tier)                        │
│                                                                     │
│   ┌───────────────────┐          ┌────────────────────────┐        │
│   │    Client (SPA)    │   REST   │   Serverless Functions  │        │
│   │    React + Vite    │────API──▶│   Express + TypeScript  │        │
│   │    TailwindCSS     │  (JWT)   │   (Prisma ORM)          │        │
│   │    TanStack Query  │◀────────│   (Zod Validation)      │        │
│   └────────┬──────────┘          └──────────┬─────────────┘        │
│            │                                 │                      │
└────────────┼─────────────────────────────────┼──────────────────────┘
             │                                 │
             │  Supabase JS SDK                │  Prisma Client
             │  (Auth + Realtime)              │  (Direct Postgres)
             │                                 │
┌────────────▼─────────────────────────────────▼──────────────────────┐
│                        SUPABASE (Free Tier)                         │
│                                                                     │
│   ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐  │
│   │   Auth    │  │   Postgres   │  │ Realtime │  │   Storage    │  │
│   │          │  │  + PostGIS   │  │          │  │              │  │
│   │ • Email  │  │              │  │ • Chat   │  │ • Room imgs  │  │
│   │ • JWT    │  │ • Users      │  │ • Typing │  │ • Avatars    │  │
│   │          │  │ • Rooms      │  │ • Online │  │              │  │
│   │          │  │ • Posts      │  │          │  │              │  │
│   │          │  │ • Messages   │  │          │  │              │  │
│   └──────────┘  └──────────────┘  └──────────┘  └──────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.2. Request Flow (Luồng xử lý chính)

```
                    ┌─────────────────────────────────────────┐
                    │            REQUEST FLOW                  │
                    └─────────────────────────────────────────┘

  Bước 1: AUTH
  ─────────────
  Browser ──▶ Supabase Auth SDK ──▶ Nhận access_token (JWT)

  Bước 2: API CALL
  ─────────────────
  Browser ──▶ Vercel Serverless (Express)
              │
              ├── [Middleware] Rate Limiter
              ├── [Middleware] CORS
              ├── [Middleware] JWT Verify (dùng SUPABASE_JWT_SECRET)
              ├── [Middleware] Zod Validation
              ├── [Controller] Parse request, gọi service
              ├── [Service] Business logic
              ├── [Repository] Prisma query → Supabase Postgres
              └── [Middleware] Global Error Handler → Response

  Bước 3: REALTIME CHAT
  ──────────────────────
  Browser ──▶ Supabase Realtime (subscribe channel)
              │
              ├── Postgres Changes: lắng nghe INSERT vào bảng messages
              ├── Broadcast: typing indicator (không persist)
              └── Presence: online/offline status
```

## 4.3. Cơ chế xác thực JWT phía Backend

1. Lấy **JWT Secret** của project Supabase (Settings → API → JWT Secret)
2. Viết **Express middleware** dùng thư viện `jsonwebtoken`:
   - Extract token từ header `Authorization: Bearer <token>`
   - Verify bằng `jwt.verify(token, SUPABASE_JWT_SECRET)`
   - Lấy claim `sub` (user id) và `email` → gắn vào `req.user`
   - `next()` nếu hợp lệ, trả **401** nếu sai/hết hạn
3. Áp middleware cho tất cả route cần đăng nhập (`router.use(authMiddleware)`)
4. Route admin dùng thêm **role middleware** kiểm tra `req.user.role === 'ADMIN'`

## 4.4. Đồng bộ User

- Khi user đăng ký qua Supabase Auth, dùng **Supabase Database Webhook** (hoặc Database Function/Trigger) gọi tới endpoint `/api/internal/sync-user` để tạo bản ghi trong bảng `users` nghiệp vụ (Prisma)
- Phương án dự phòng: Auth middleware tự tạo record nếu chưa tồn tại (kiểm tra bằng `sub`)
- **Role** (`TENANT` / `LANDLORD` / `ADMIN`) lưu ở bảng `users` phía Postgres do backend quản lý, KHÔNG lưu trong Supabase Auth metadata

---

# 5. CẤU TRÚC PROJECT

## 5.1. Monorepo Layout

```
boarding-home/                        ← Root (1 Git repo)
├── client/                           ← Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/                   ← Static assets (icons, images)
│   │   ├── components/               ← Reusable UI components
│   │   │   ├── ui/                   ← shadcn/ui components
│   │   │   ├── layout/               ← Header, Sidebar, Footer
│   │   │   └── common/               ← Shared components (LoadingSpinner, ErrorBoundary)
│   │   ├── features/                 ← Feature-based modules
│   │   │   ├── auth/                 ← Login, Register, ProfileComplete
│   │   │   ├── rooms/                ← RoomList, RoomDetail, RoomForm
│   │   │   ├── chat/                 ← ChatList, ChatWindow
│   │   │   ├── forum/                ← PostList, PostDetail, PostForm
│   │   │   ├── map/                  ← MapView, LocationPicker
│   │   │   ├── chatbot/              ← ChatbotWidget
│   │   │   └── admin/                ← AdminDashboard, UserManagement
│   │   ├── hooks/                    ← Custom hooks (useAuth, useGeolocation)
│   │   ├── lib/                      ← Utility libraries
│   │   │   ├── supabase.ts           ← Supabase client init
│   │   │   ├── api.ts                ← Axios/fetch wrapper
│   │   │   └── utils.ts              ← Helper functions
│   │   ├── schemas/                  ← Shared Zod schemas (symlink hoặc copy từ shared/)
│   │   ├── types/                    ← TypeScript type definitions
│   │   ├── pages/                    ← Page components (route-level)
│   │   ├── router.tsx                ← React Router config
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                           ← Backend (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/              ← Request/Response handling
│   │   │   ├── auth.controller.ts
│   │   │   ├── room.controller.ts
│   │   │   ├── post.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chatbot.controller.ts
│   │   │   ├── favorite.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── services/                 ← Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── room.service.ts
│   │   │   ├── post.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── chatbot.service.ts
│   │   │   ├── favorite.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── geocoding.service.ts
│   │   │   └── admin.service.ts
│   │   ├── repositories/             ← Data access layer (wraps Prisma)
│   │   │   ├── user.repository.ts
│   │   │   ├── room.repository.ts
│   │   │   ├── post.repository.ts
│   │   │   ├── message.repository.ts
│   │   │   ├── favorite.repository.ts
│   │   │   └── report.repository.ts
│   │   ├── middlewares/              ← Express middlewares
│   │   │   ├── auth.middleware.ts     ← JWT verify (Supabase)
│   │   │   ├── role.middleware.ts     ← Role-based access
│   │   │   ├── validate.middleware.ts ← Zod schema validation
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   └── error.middleware.ts    ← Global error handler
│   │   ├── routes/                   ← Route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── room.routes.ts
│   │   │   ├── post.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── chatbot.routes.ts
│   │   │   ├── favorite.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── dto/                      ← Zod schemas (request/response)
│   │   │   ├── auth.dto.ts
│   │   │   ├── room.dto.ts
│   │   │   ├── post.dto.ts
│   │   │   └── pagination.dto.ts
│   │   ├── utils/                    ← Helpers
│   │   │   ├── logger.ts             ← Pino logger setup
│   │   │   ├── AppError.ts           ← Custom error class
│   │   │   ├── constants.ts          ← App constants
│   │   │   └── pagination.ts         ← Pagination helper
│   │   ├── config/                   ← Configuration
│   │   │   ├── env.ts                ← Environment validation (Zod)
│   │   │   ├── cors.ts               ← CORS config
│   │   │   └── supabaseAdmin.ts      ← Supabase admin client
│   │   ├── types/                    ← TypeScript types
│   │   │   └── express.d.ts          ← Extend Express Request type
│   │   └── app.ts                    ← Express app setup
│   ├── prisma/
│   │   ├── schema.prisma             ← Database schema
│   │   ├── migrations/               ← Migration files
│   │   └── seed.ts                   ← Seed data
│   ├── __tests__/                    ← Test files
│   │   ├── unit/
│   │   │   └── services/
│   │   └── integration/
│   │       └── routes/
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                           ← Shared code (FE + BE)
│   ├── schemas/                      ← Zod schemas dùng chung
│   │   ├── room.schema.ts
│   │   ├── post.schema.ts
│   │   └── user.schema.ts
│   └── types/                        ← Shared TypeScript types
│       ├── api.types.ts              ← API response format
│       └── enums.ts                  ← Role, RoomStatus, etc.
│
├── .github/
│   └── workflows/
│       └── ci.yml                    ← GitHub Actions (lint + test)
├── .env.example                      ← Template cho environment variables
├── .gitignore
├── vercel.json                       ← Vercel deployment config
├── pnpm-workspace.yaml               ← pnpm workspace config
└── README.md
```

## 5.2. Lý do tách layer

| Layer | Trách nhiệm | Lý do tách |
|-------|-------------|-----------|
| **Controller** | Parse request params/body, gọi service, format response | Không chứa business logic → dễ test route handling |
| **Service** | Business logic, orchestration, gọi repository | Không biết dùng Prisma hay gì → dễ thay đổi data source |
| **Repository** | Wrap Prisma Client, chỉ chứa data access queries | Dễ mock trong unit test. Tập trung query phức tạp 1 chỗ |
| **DTO (Zod)** | Validate + transform request data | Tái sử dụng validation logic cả FE + BE |
| **Middleware** | Cross-cutting: auth, validation, error, rate limit | Tách khỏi business logic. Plug-and-play |

---

# 6. THIẾT KẾ CƠ SỞ DỮ LIỆU

## 6.1. Schema Overview (12 models)

```
┌──────────┐     ┌────────────────┐     ┌──────────┐
│   User   │────▶│ BoardingHouse  │────▶│   Room   │
│          │     │                │     │          │
│ • id     │     │ • ownerId (FK) │     │ • bhId   │
│ • role   │     │ • lat/lng      │     │ • price  │
│ • email  │     │ • geog (GIS)   │     │ • area   │
└────┬─────┘     └────────────────┘     └──────────┘
     │
     ├────▶ Post ────▶ Comment
     │
     ├────▶ Message
     │
     ├────▶ Favorite (boarding house bookmarks)
     │
     ├────▶ Report
     │
     └────▶ ChatRoomMember ────▶ ChatRoom
```

## 6.2. Prisma Schema (chi tiết)

> [!NOTE]
> Schema dưới đây là **minh hoạ cấu trúc**, không phải code cuối. Cột `geog geography(Point,4326)` cần tạo bằng raw SQL migration vì Prisma chưa hỗ trợ kiểu geography native.

### User

```prisma
model User {
  id            String    @id                    // = auth.users.id từ Supabase
  email         String    @unique
  phone         String?   @unique
  fullName      String?
  cccd          String?
  bio           String?
  avatarUrl     String?
  role          Role      @default(TENANT)
  isActive      Boolean   @default(true)         // Soft ban: admin set false
  isProfileComplete Boolean @default(false)      // Đã hoàn thiện hồ sơ chưa
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  boardingHouses BoardingHouse[]
  posts          Post[]
  comments       Comment[]
  messages       Message[]
  favorites      Favorite[]
  reports        Report[]
  chatRoomMembers ChatRoomMember[]
}

enum Role {
  TENANT
  LANDLORD
  ADMIN
}
```

### BoardingHouse & Room

```prisma
model BoardingHouse {
  id            String    @id @default(uuid())
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id])
  name          String
  address       String
  ward          String?                          // Phường/Xã
  district      String?                          // Quận/Huyện
  city          String?                          // Tỉnh/Thành
  lat           Float
  lng           Float
  // geog       geography(Point, 4326)           ← tạo bằng raw SQL migration
  description   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  rooms         Room[]
  favorites     Favorite[]
}

model Room {
  id              String      @id @default(uuid())
  boardingHouseId String
  boardingHouse   BoardingHouse @relation(fields: [boardingHouseId], references: [id], onDelete: Cascade)
  roomCode        String                          // Mã phòng (P01, P02...)
  status          RoomStatus  @default(AVAILABLE)
  price           Float                           // VNĐ/tháng
  area            Float                           // m²
  maxOccupants    Int?                            // Số người tối đa
  amenities       Json?                           // ["wifi", "máy lạnh", "gác lửng"...]
  content         String?                          // Mô tả chi tiết
  images          Json?                           // URL array từ Supabase Storage
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  posts           Post[]
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
}
```

### Post & Comment (Diễn đàn)

```prisma
model Post {
  id          String    @id @default(uuid())
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  roomId      String?                             // Nullable: bài share phòng trọ có roomId, bài diễn đàn không có
  room        Room?     @relation(fields: [roomId], references: [id])
  type        PostType  @default(DISCUSSION)
  title       String
  content     String
  images      Json?
  isPublished Boolean   @default(true)            // Admin có thể ẩn bài vi phạm
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  comments    Comment[]
}

enum PostType {
  DISCUSSION                                      // Bài diễn đàn thường
  ROOM_SHARE                                      // Bài chia sẻ phòng trọ
}

model Comment {
  id          String    @id @default(uuid())
  postId      String
  post        Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  content     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Chat & Message

```prisma
model ChatRoom {
  id          String    @id @default(uuid())
  type        ChatType  @default(DIRECT)
  createdAt   DateTime  @default(now())

  members     ChatRoomMember[]
  messages    Message[]
}

enum ChatType {
  DIRECT                                          // Chat 1-1
}

model ChatRoomMember {
  chatRoomId  String
  userId      String
  chatRoom    ChatRoom  @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
  joinedAt    DateTime  @default(now())

  @@id([chatRoomId, userId])
}

model Message {
  id          String    @id @default(uuid())
  chatRoomId  String
  chatRoom    ChatRoom  @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  senderId    String
  sender      User      @relation(fields: [senderId], references: [id])
  content     String
  type        String    @default("text")          // "text" | "image"
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())
}
```

### Favorite, Report

```prisma
model Favorite {
  id              String        @id @default(uuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  boardingHouseId String
  boardingHouse   BoardingHouse @relation(fields: [boardingHouseId], references: [id], onDelete: Cascade)
  createdAt       DateTime      @default(now())

  @@unique([userId, boardingHouseId])             // 1 user chỉ favorite 1 nhà trọ 1 lần
}

model Report {
  id          String    @id @default(uuid())
  reporterId  String
  reporter    User      @relation(fields: [reporterId], references: [id])
  targetType  String                              // "post" | "user" | "boarding_house"
  targetId    String
  reason      String
  status      ReportStatus @default(PENDING)
  adminNote   String?                             // Ghi chú xử lý của admin
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}
```

## 6.3. PostGIS Setup

Prisma chưa hỗ trợ kiểu `geography` native, nên cần:

1. **Raw SQL migration:** Sau khi chạy `prisma migrate dev`, tạo thêm migration thủ công:
   ```sql
   -- Bật PostGIS extension
   CREATE EXTENSION IF NOT EXISTS postgis;

   -- Thêm cột geography vào bảng BoardingHouse
   ALTER TABLE "BoardingHouse"
     ADD COLUMN geog geography(Point, 4326);

   -- Tạo spatial index
   CREATE INDEX idx_boarding_house_geog
     ON "BoardingHouse" USING GIST (geog);

   -- Trigger tự cập nhật geog khi INSERT/UPDATE lat, lng
   CREATE OR REPLACE FUNCTION update_geog()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.geog := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trg_update_geog
     BEFORE INSERT OR UPDATE OF lat, lng ON "BoardingHouse"
     FOR EACH ROW EXECUTE FUNCTION update_geog();
   ```

2. **Query tìm phòng gần vị trí** dùng `prisma.$queryRaw`:
   ```sql
   SELECT *, ST_Distance(geog, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography) AS distance
   FROM "BoardingHouse"
   WHERE ST_DWithin(geog, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography, $radiusMeters)
   ORDER BY distance ASC
   LIMIT $limit OFFSET $offset;
   ```

## 6.4. Seed Data

Chuẩn bị seed data thực tế cho demo:
- 3 users (1 tenant, 1 landlord, 1 admin)
- 5 nhà trọ ở các quận khác nhau (HCM/Hà Nội) với toạ độ thật
- 15 phòng trọ (mỗi nhà 3 phòng) với giá thực tế (1.5tr - 5tr)
- 10 bài đăng diễn đàn
- 20 tin nhắn mẫu

---

# 7. PHÂN TÍCH CHỨC NĂNG CHI TIẾT

## 7.1. Người tìm trọ (TENANT)

### F1: Định vị tự động
- Ưu tiên `navigator.geolocation` (trình duyệt)
- Fallback: IP-based geolocation (ipapi.co hoặc ip-api.com) khi user từ chối quyền
- Reverse geocoding (Nominatim) để suy ra Tỉnh/Thành → Quận/Huyện → Phường/Xã
- Auto-refresh danh sách khi vị trí thay đổi (debounce 500ms)

### F2: Tìm kiếm phòng trọ
- **Search bar** với autocomplete địa danh (Nominatim API)
- **Bộ lọc:**
  - Giá phòng: range slider (min – max)
  - Diện tích: range slider
  - Số người ở: dropdown
  - Tiện ích: checkbox multi-select (wifi, máy lạnh, gác lửng, chỗ để xe…)
  - Bán kính: slider 1km – 20km (mặc định 5km)
- **Kết quả:** danh sách + bản đồ song song (split view)
- Backend dùng PostGIS `ST_DWithin` + Prisma `where` clause

### F3: Xem chi tiết phòng trọ
- Carousel ảnh phòng
- Thông tin: giá, diện tích, tiện ích, mô tả, địa chỉ
- Vị trí trên bản đồ mini (Leaflet)
- Thông tin chủ trọ (avatar, tên, SĐT)
- Nút: "Nhắn tin", "Gọi điện" (tel: link), "Lưu yêu thích"

### F4: Chat 1-1 với chủ trọ
- Từ trang chi tiết → bấm "Nhắn tin" → tạo/mở ChatRoom (DIRECT)
- Gửi tin nhắn text + ảnh
- Typing indicator (Supabase Broadcast)
- Trạng thái online/offline (Supabase Presence)
- Badge đếm tin chưa đọc
- Lịch sử chat persist trong DB, load thêm khi scroll lên (cursor pagination)

### F5: Lưu yêu thích
- Bấm icon ♥ để bookmark nhà trọ
- Trang "Yêu thích" liệt kê danh sách đã lưu
- Toggle on/off

### F6: Diễn đàn
- Xem danh sách bài viết (mới nhất trước)
- Xem chi tiết bài viết + comments
- Tạo bài mới (type: DISCUSSION)
- Comment trên bài viết
- Report bài viết vi phạm

### F7: Chatbot AI
- Widget nổi (floating button) góc phải dưới
- Mở ra khung chat với AI
- Hỗ trợ: FAQ, hướng dẫn dùng web, gợi ý tìm phòng theo tiêu chí
- Backend gọi Gemini API với system prompt chứa context về web

## 7.2. Chủ trọ (LANDLORD)

### F8: Quản lý nhà trọ
- Dashboard riêng: danh sách nhà trọ đã tạo
- Tạo nhà trọ: tên, địa chỉ, mô tả, chọn vị trí trên bản đồ (click để lấy lat/lng)
- Sửa thông tin nhà trọ
- Xoá nhà trọ (soft delete / cascade xoá phòng)

### F9: Quản lý phòng trọ
- Mỗi nhà trọ có nhiều phòng
- Tạo phòng: mã phòng, giá, diện tích, số người, tiện ích, mô tả, ảnh (upload Supabase Storage)
- Chuyển trạng thái: AVAILABLE ↔ OCCUPIED
- Sửa / Xoá phòng

### F10: Share phòng trọ lên diễn đàn
- Từ dashboard → chọn phòng → "Đăng lên diễn đàn"
- Tự tạo bài Post (type: ROOM_SHARE) với roomId liên kết

### F11: Chat với người tìm trọ
- Giống F4, chủ trọ cũng nhận và trả lời tin nhắn

## 7.3. Admin

### F12: Quản lý người dùng
- Danh sách users (table với search + filter theo role)
- Khoá / Mở khoá tài khoản (set `isActive = false/true`)
- Xem chi tiết profile

### F13: Quản lý bài đăng
- Danh sách bài đăng (filter theo type, status)
- Ẩn bài vi phạm (set `isPublished = false`)
- Xoá bài đăng

### F14: Quản lý Report
- Danh sách report (filter theo status: PENDING, REVIEWED, RESOLVED, DISMISSED)
- Xem chi tiết report → link đến bài đăng/user bị report
- Cập nhật status + ghi chú xử lý

### F15: Thống kê cơ bản
- Tổng số user (theo role)
- Tổng số nhà trọ / phòng trọ
- Tổng số bài đăng
- Biểu đồ: user đăng ký theo tháng, bài đăng theo tuần
- Dùng Recharts để vẽ chart

---

# 8. CROSS-CUTTING CONCERNS

## 8.1. Error Handling Strategy

### Nguyên tắc
- **Mọi lỗi đều đi qua Global Error Handler** — không try/catch rồi trả response trong controller
- Phân biệt **Operational Error** (lỗi dự đoán được: validation fail, not found, unauthorized) và **Programming Error** (bug: null reference, type error)
- Response format thống nhất cho mọi lỗi

### Custom Error Class: `AppError`

| Property | Type | Mô tả |
|----------|------|--------|
| `statusCode` | number | HTTP status code (400, 401, 403, 404, 500) |
| `message` | string | Message hiển thị cho user |
| `code` | string | Error code cho frontend handle (e.g., `ROOM_NOT_FOUND`) |
| `isOperational` | boolean | `true` = lỗi dự đoán được, `false` = bug cần fix |

### Error Response Format (JSON)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Giá phòng phải lớn hơn 0",
    "details": [...]
  }
}
```

### Success Response Format (JSON)

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Global Error Handler Middleware
- Đặt **cuối cùng** trong Express middleware chain
- Log error (Pino)
- Nếu `isOperational = true`: trả response với statusCode + message từ AppError
- Nếu `isOperational = false`: trả 500, log stack trace, KHÔNG expose chi tiết lỗi cho client
- Trong development: bao gồm stack trace trong response
- Trong production: chỉ trả message chung "Internal Server Error"

## 8.2. Logging

### Công cụ: Pino

| Lý do chọn Pino | Chi tiết |
|-----------------|---------|
| Performance | Nhanh hơn Winston ~5x (low overhead) |
| Structured logging | Output JSON → dễ parse bằng log aggregator |
| Vercel compatible | Vercel ghi logs từ stdout/stderr → Pino output JSON ra stdout phù hợp |

### Log Levels

| Level | Khi nào dùng | Ví dụ |
|-------|-------------|-------|
| `fatal` | App crash, không recover được | Database connection fail |
| `error` | Lỗi cần xử lý | Unhandled exception, external API fail |
| `warn` | Không lỗi nhưng cần chú ý | Rate limit exceeded, deprecated API call |
| `info` | Business events quan trọng | User registered, room created, chat started |
| `debug` | Chi tiết kỹ thuật (chỉ dev) | Query params, request body, timing |

### Cấu trúc log entry

```json
{
  "level": "info",
  "time": "2026-08-05T10:30:00Z",
  "requestId": "uuid-v4",
  "userId": "user-123",
  "method": "POST",
  "path": "/api/rooms",
  "statusCode": 201,
  "responseTime": 45,
  "message": "Room created successfully"
}
```

### Request ID (Correlation ID)
- Middleware tạo UUID cho mỗi request → gắn vào `req.id`
- Mọi log trong request đó đều kèm `requestId`
- Frontend nhận `requestId` trong response header `X-Request-Id` → debug cross-system

### Health Check Endpoint
- `GET /api/health` → trả `{ status: "ok", timestamp, uptime, version }`
- Không cần auth. Dùng để monitor service health

## 8.3. Validation Strategy

### Nguyên tắc
- **Validate ở cả Frontend và Backend** — Frontend validate UX, Backend validate security
- **Single source of truth:** Zod schema định nghĩa 1 lần trong `shared/schemas/`, dùng ở cả 2 bên
- **Validate sớm, fail nhanh:** Middleware validate TRƯỚC khi vào controller

### Validation Middleware Pattern

| Bước | Xử lý |
|------|-------|
| 1 | Request đến → Validation middleware nhận Zod schema |
| 2 | `schema.safeParse(req.body)` |
| 3 | Nếu fail → throw `AppError(400, 'Validation Error', 'VALIDATION_ERROR')` kèm chi tiết lỗi |
| 4 | Nếu pass → `req.body = result.data` (parsed + typed) → `next()` |

### Validate gì ở đâu

| Vị trí | Validate | Ví dụ |
|--------|---------|-------|
| **Frontend (React Hook Form + Zod)** | Format, required, min/max | Email format, password length, giá > 0 |
| **Backend Middleware (Zod)** | Giống FE + business rules | Duplicate check, enum values, string sanitize |
| **Backend Service** | Business logic validation | User có quyền sửa room này không? Room còn available không? |
| **Database (Prisma)** | Constraints | @unique, @relation, enum |

## 8.4. Pagination

### Strategy: Offset-based Pagination

- Dùng **offset-based** (không cursor-based) vì đơn giản hơn, phù hợp scope đồ án
- Cursor-based chỉ cần thiết khi dataset rất lớn (>100k records) — đồ án không đạt mức này

### Pagination Parameters

| Parameter | Type | Default | Mô tả |
|-----------|------|---------|--------|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 20 | Số item mỗi trang (max: 100) |
| `sortBy` | string | "createdAt" | Trường sắp xếp |
| `sortOrder` | "asc" \| "desc" | "desc" | Thứ tự sắp xếp |

### Pagination Response Format

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

### Áp dụng cho API nào

| API | Pagination | Lý do |
|-----|-----------|-------|
| `GET /api/rooms/search` | ✅ Có | Kết quả search có thể rất nhiều |
| `GET /api/posts` | ✅ Có | Feed diễn đàn |
| `GET /api/chat/:chatRoomId/messages` | ✅ Có (reverse order) | Lịch sử chat, load thêm khi scroll lên |
| `GET /api/admin/users` | ✅ Có | Danh sách user |
| `GET /api/admin/reports` | ✅ Có | Danh sách report |
| `GET /api/favorites` | ✅ Có | Danh sách yêu thích |
| `GET /api/rooms/:id` | ❌ Không | Trả 1 item duy nhất |

### Chat Messages: Infinite Scroll
- Frontend gọi `GET /api/chat/:id/messages?page=1&limit=30` khi mở chat
- Khi scroll lên → gọi `page=2`, `page=3`...
- Tin nhắn mới nhận qua Supabase Realtime (không cần poll)

## 8.5. Rate Limiting

### Công cụ: express-rate-limit

### Cấu hình theo nhóm API

| Nhóm | Window | Max requests | Lý do |
|------|--------|-------------|-------|
| **Auth** (`/api/auth/*`) | 15 phút | 10 | Chống brute-force login |
| **Chatbot** (`/api/chatbot/*`) | 1 phút | 10 | Giới hạn tương ứng Gemini API free tier |
| **Upload** (`/api/upload/*`) | 1 phút | 5 | Tránh abuse storage |
| **General API** (`/api/*`) | 1 phút | 60 | Mặc định cho tất cả API còn lại |
| **Search** (`/api/rooms/search`) | 1 phút | 30 | Query PostGIS tốn tài nguyên |

### Response khi bị rate limit

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Quá nhiều request. Vui lòng thử lại sau 60 giây.",
    "retryAfter": 60
  }
}
```

- HTTP Status: **429 Too Many Requests**
- Header: `Retry-After: 60`

### Lưu ý Vercel Serverless
- Vercel Serverless Functions là stateless → `express-rate-limit` mặc định dùng in-memory store **không hoạt động** giữa các invocation
- **Giải pháp cho đồ án:** Dùng Supabase Postgres làm store (rate-limit-prisma) hoặc chấp nhận rate limit approximate (mỗi cold start reset counter). Với quy mô demo, in-memory đủ dùng vì Vercel giữ warm instance trong vài phút

## 8.6. Security

### Checklist bảo mật

| # | Hạng mục | Giải pháp | Thư viện |
|---|---------|----------|---------|
| 1 | **Security Headers** | Helmet.js (X-Frame-Options, CSP, HSTS, etc.) | `helmet` |
| 2 | **CORS** | Chỉ cho phép domain frontend | Express CORS middleware |
| 3 | **Input Sanitization** | Zod `.trim()`, `.transform()`. Escape HTML trong user content | Zod + `xss` package |
| 4 | **SQL Injection** | Prisma parameterized queries (tự động). Raw query dùng `$queryRaw` template literal | Prisma |
| 5 | **JWT Validation** | Verify mỗi request bằng Supabase JWT Secret | `jsonwebtoken` |
| 6 | **File Upload** | Validate MIME type + kích thước (max 5MB/ảnh). Chỉ cho phép image/* | `multer` |
| 7 | **Rate Limiting** | Xem mục 8.5 | `express-rate-limit` |
| 8 | **Environment Variables** | KHÔNG commit `.env`. Validate bằng Zod lúc startup | Zod |

## 8.7. Environment Management

### Danh sách Environment Variables

```env
# === Supabase ===
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...                    # Public key (dùng ở FE)
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # Secret key (chỉ BE, KHÔNG expose FE)
SUPABASE_JWT_SECRET=your-jwt-secret         # Để verify JWT ở BE

# === Database ===
DATABASE_URL=postgresql://user:pass@host:5432/db   # Prisma connection string

# === Gemini AI ===
GEMINI_API_KEY=your-gemini-api-key

# === App ===
NODE_ENV=development                         # development | production
PORT=3001                                    # Local dev port
CORS_ORIGIN=http://localhost:5173            # Frontend URL

# === Frontend (.env cho Vite) ===
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3001/api       # Backend API URL
```

### Validation: Dùng Zod verify lúc app startup

- File `config/env.ts` định nghĩa Zod schema cho tất cả env vars
- Nếu thiếu hoặc sai format → app crash ngay với message rõ ràng
- KHÔNG dùng `process.env.XXX` trực tiếp trong code → luôn import từ `config/env.ts`

### Environments

| Env | Mô tả | Supabase Project |
|-----|-------|-----------------|
| `development` | Local dev (Vite + nodemon) | Supabase project "dev" |
| `production` | Vercel deployment | Cùng Supabase project (đồ án nhỏ, 1 project đủ) |

## 8.8. Testing Strategy

### Nguyên tắc
- **Test song song với development** — mỗi module hoàn thành → viết test luôn
- Tập trung vào **Service layer** (business logic) và **API integration** (route → response)
- KHÔNG test Prisma Client trực tiếp (đó là test thư viện bên thứ 3)

### Test Pyramid cho đồ án

```
        ┌─────────┐
        │ Manual  │  ← Demo trước hội đồng
        │  Test   │
        ├─────────┤
        │  API    │  ← Supertest: test full route → response
        │ Integr. │     (5-8 test files)
        ├─────────┤
        │  Unit   │  ← Vitest: test service logic
        │  Tests  │     (8-12 test files)
        └─────────┘
```

### Unit Tests (Vitest)

| Target | Cần test | Ví dụ |
|--------|---------|-------|
| **Services** | Business logic, edge cases | `room.service.test.ts`: tạo room khi user không phải LANDLORD → throw error |
| **Utils** | Helper functions | `pagination.test.ts`: tính totalPages đúng |
| **Middlewares** | Auth, validation | `auth.middleware.test.ts`: token hết hạn → 401 |

**Mock strategy:** Mock repository layer bằng Vitest `vi.mock()`. Service test không cần DB thật.

### Integration Tests (Supertest)

| Target | Cần test | Ví dụ |
|--------|---------|-------|
| **Route → Controller → Service → Response** | Full flow API | `POST /api/rooms` với body đúng → 201 + room data |
| **Auth flow** | JWT middleware hoạt động đúng | Request không có token → 401 |
| **Validation** | Zod reject body sai | `POST /api/rooms` thiếu `price` → 400 + error details |

### Không cần viết test cho
- Prisma Client (thư viện bên thứ 3)
- Supabase SDK (thư viện bên thứ 3)
- UI components (tốn thời gian, ROI thấp cho đồ án)

### Commands

```bash
pnpm --filter server test              # Chạy all tests
pnpm --filter server test:unit         # Chạy unit tests
pnpm --filter server test:integration  # Chạy integration tests
pnpm --filter server test:coverage     # Coverage report
```

### Mục tiêu Coverage
- Services: **>70%**
- Middlewares: **>60%**
- Overall: **>50%** (đủ tốt cho đồ án)

---

# 9. DANH SÁCH TRANG / MÀN HÌNH

| # | Trang | Route | Role | Mô tả |
|---|-------|-------|------|--------|
| 1 | Đăng nhập | `/login` | Public | Form email + password |
| 2 | Đăng ký | `/register` | Public | Form đăng ký + chọn role |
| 3 | Hoàn thiện hồ sơ | `/onboarding` | Auth | Modal/page bổ sung thông tin (SĐT, CCCD, avatar) |
| 4 | Trang chủ (Feed) | `/` | Auth | Feed phòng trọ gần vị trí + bản đồ |
| 5 | Tìm kiếm / Bản đồ | `/search` | Auth | Search bar + bộ lọc + bản đồ full + danh sách kết quả |
| 6 | Chi tiết phòng trọ | `/rooms/:id` | Auth | Carousel ảnh, thông tin chi tiết, nút nhắn tin |
| 7 | Chat | `/chat` | Auth | Danh sách hội thoại (trái) + khung chat (phải) |
| 8 | Diễn đàn | `/forum` | Auth | Danh sách bài viết |
| 9 | Chi tiết bài viết | `/forum/:id` | Auth | Nội dung + comments |
| 10 | Tạo bài viết | `/forum/new` | Auth | Form tạo bài diễn đàn |
| 11 | Dashboard Chủ trọ | `/dashboard` | LANDLORD | Quản lý nhà trọ + phòng |
| 12 | Tạo/Sửa nhà trọ | `/dashboard/boarding-house/new` | LANDLORD | Form tạo nhà trọ + chọn vị trí bản đồ |
| 13 | Tạo/Sửa phòng | `/dashboard/rooms/new` | LANDLORD | Form tạo phòng + upload ảnh |
| 14 | Yêu thích | `/favorites` | Auth | Danh sách nhà trọ đã bookmark |
| 15 | Hồ sơ cá nhân | `/profile` | Auth | Xem + sửa thông tin cá nhân |
| 16 | Admin Dashboard | `/admin` | ADMIN | Thống kê tổng quan |
| 17 | Admin - Users | `/admin/users` | ADMIN | Table quản lý user |
| 18 | Admin - Posts | `/admin/posts` | ADMIN | Table quản lý bài đăng |
| 19 | Admin - Reports | `/admin/reports` | ADMIN | Table quản lý report |
| 20 | Chatbot | Widget nổi (mọi trang) | Auth | Floating button → mở chat popup AI |

---

# 10. MVP DEFINITION

> [!IMPORTANT]
> MVP = phiên bản **tối thiểu nhưng hoàn chỉnh** để demo được. Mục tiêu: **có sản phẩm chạy được ổn định cuối tuần 7**, sau đó bổ sung tính năng nâng cao.

### 🟢 MVP (Tuần 1 → 7) — PHẢI HOÀN THÀNH

| # | Tính năng | Ước lượng giờ |
|---|----------|--------------|
| 1 | Setup project + Supabase + Vercel + CI | 10h |
| 2 | Auth (đăng ký/đăng nhập/chọn role) + Hoàn thiện hồ sơ | 12h |
| 3 | CRUD Nhà trọ + Phòng trọ + Upload ảnh | 20h |
| 4 | Tìm kiếm + PostGIS + Bản đồ Leaflet + Bộ lọc | 22h |
| 5 | Trang chi tiết phòng trọ + Lưu yêu thích | 10h |
| 6 | Chat 1-1 realtime (Supabase Realtime) | 20h |
| **Tổng MVP** | | **~94h** (~6.3 tuần × 15h) |

### 🔶 Nâng cao (Tuần 8 → 11) — NÊN HOÀN THÀNH

| # | Tính năng | Ước lượng giờ |
|---|----------|--------------|
| 7 | Diễn đàn (CRUD post + comment) | 15h |
| 8 | Chatbot AI (Gemini) | 12h |
| 9 | Admin Dashboard (CRUD user/post/report + thống kê) | 18h |
| **Tổng nâng cao** | | **~45h** (~3 tuần × 15h) |

### 🔵 Polish (Tuần 12 → 13)

| # | Tính năng | Ước lượng giờ |
|---|----------|--------------|
| 10 | Bug fix + UI polish + Responsive + Performance | 15h |
| 11 | Seed data + Swagger docs + README | 8h |
| 12 | Viết báo cáo + slide + chuẩn bị demo | 15h |
| **Tổng polish** | | **~38h** (~2.5 tuần × 15h) |

### Tổng: ~177h / 195h có sẵn → buffer ~18h cho unexpected issues

---

# 11. LỘ TRÌNH PHÁT TRIỂN 13 TUẦN

## Tuần 1: Setup & Design (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Thiết kế UI/UX trên Figma (wireframe các trang chính) | 5h | Figma link |
| Khởi tạo monorepo (pnpm workspace, client + server + shared) | 2h | Git repo + README |
| Setup Supabase project (Auth, Postgres, Storage, Realtime) | 2h | Supabase dashboard |
| Định nghĩa `schema.prisma` + chạy migration đầu tiên | 2h | DB schema |
| Setup PostGIS (raw SQL migration) | 1h | PostGIS enabled |
| Cấu hình Vercel deployment (vercel.json, env vars) | 1h | Preview deployment |
| Setup ESLint + Prettier + GitHub Actions CI | 1h | CI pipeline |
| Setup `.env.example` + `config/env.ts` (Zod validate) | 1h | Env management |

**Checkpoint:** Repo sẵn sàng, Supabase connected, CI chạy, deploy preview hoạt động

---

## Tuần 2: Auth & User Management (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Frontend: trang Login + Register (shadcn/ui form + Zod) | 4h | 2 pages |
| Frontend: AuthContext/Provider (Supabase JS SDK) | 2h | Auth state management |
| Backend: auth middleware (JWT verify Supabase) | 2h | `auth.middleware.ts` |
| Backend: role middleware | 1h | `role.middleware.ts` |
| Backend: user sync endpoint + service | 2h | `POST /api/internal/sync-user` |
| Frontend: Onboarding page (hoàn thiện hồ sơ) | 2h | `/onboarding` page |
| Backend: API update profile | 1h | `PATCH /api/users/profile` |
| Unit test: auth middleware, role middleware | 1h | Test files |

**Checkpoint:** User có thể đăng ký, đăng nhập, hoàn thiện hồ sơ. JWT verify hoạt động.

---

## Tuần 3: CRUD Nhà trọ & Phòng — Backend (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Backend: error handling setup (AppError + global error middleware) | 2h | Error system |
| Backend: validation middleware (Zod) | 1h | `validate.middleware.ts` |
| Backend: rate limiting middleware | 1h | `rateLimiter.middleware.ts` |
| Backend: logging setup (Pino + request ID) | 1.5h | Logger + middleware |
| Backend: pagination helper + DTO | 1h | `pagination.ts` |
| Backend: CRUD boarding house (controller + service + repository + routes) | 3h | Boarding house API |
| Backend: CRUD room (controller + service + repository + routes) | 3h | Room API |
| Backend: file upload endpoint (multer + Supabase Storage) | 1.5h | Upload API |
| Unit test: room.service, boardingHouse.service | 1h | Test files |

**Checkpoint:** API CRUD nhà trọ/phòng hoạt động, có validation, error handling, logging, rate limiting

---

## Tuần 4: CRUD Nhà trọ & Phòng — Frontend (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Frontend: Dashboard chủ trọ (danh sách nhà trọ) | 3h | `/dashboard` |
| Frontend: Form tạo/sửa nhà trọ + chọn vị trí bản đồ (Leaflet) | 4h | Form + map picker |
| Frontend: Quản lý phòng trọ (list + form + upload ảnh) | 4h | Room management UI |
| Frontend: TanStack Query setup (API hooks) | 2h | Custom hooks |
| Frontend: Layout components (Header, Sidebar, ProtectedRoute) | 2h | Layout system |

**Checkpoint:** Chủ trọ có thể tạo/sửa/xoá nhà trọ + phòng trọ qua giao diện web

---

## Tuần 5: Tìm kiếm & Bản đồ (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Backend: API search phòng trọ (PostGIS `ST_DWithin` + filters + pagination) | 4h | `GET /api/rooms/search` |
| Frontend: hook `useGeolocation` (GPS + IP fallback) | 2h | Geolocation hook |
| Frontend: Trang chủ feed (danh sách phòng gần vị trí) | 3h | `/` page |
| Frontend: Trang tìm kiếm (search bar + autocomplete Nominatim + bộ lọc) | 3h | `/search` page |
| Frontend: Bản đồ Leaflet (markers, popups, cluster) | 2h | Map component |
| Integration test: search API (PostGIS query) | 1h | Test file |

**Checkpoint:** User có thể tìm phòng trọ theo vị trí + bộ lọc, xem trên bản đồ

---

## Tuần 6: Chi tiết phòng & Yêu thích (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Frontend: Trang chi tiết phòng trọ (carousel, info, bản đồ mini, chủ trọ) | 4h | `/rooms/:id` |
| Backend: API chi tiết phòng (kèm info chủ trọ) | 1.5h | `GET /api/rooms/:id` |
| Backend: CRUD favorite (controller + service + repository) | 2h | Favorite API |
| Frontend: Nút yêu thích + trang danh sách yêu thích | 2h | `/favorites` |
| Frontend: Trang hồ sơ cá nhân (xem + sửa) | 2h | `/profile` |
| Backend: API lấy/sửa profile | 1h | Profile API |
| Swagger docs setup (swagger-jsdoc config + annotate existing routes) | 1.5h | `/api/docs` |
| Bug fix + refactor code từ tuần 1-5 | 1h | Cleaner code |

**Checkpoint:** Core features hoàn chỉnh (CRUD + search + map + detail + favorite). Swagger docs live.

---

## Tuần 7: Chat Realtime (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Backend: API tạo/lấy chat room + gửi/lấy messages | 3h | Chat API |
| Backend: API đánh dấu đã đọc (mark as read) | 1h | Read status API |
| Frontend: Trang chat (layout 2 cột: chat list + chat window) | 4h | `/chat` |
| Frontend: Supabase Realtime subscription (new messages) | 2h | Real-time chat |
| Frontend: Typing indicator (Supabase Broadcast) | 1h | Typing UX |
| Frontend: Online/Offline status (Supabase Presence) | 1h | Presence UX |
| Frontend: Badge tin nhắn chưa đọc (header icon) | 1h | Unread badge |
| Unit test: chat.service | 1h | Test file |
| Integration test: chat API | 1h | Test file |

**Checkpoint:** ✅ **MVP HOÀN THÀNH.** Chat 1-1 realtime hoạt động. Sản phẩm có thể demo được.

---

## Tuần 8: Diễn đàn (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Backend: CRUD post + comment (controller + service + repository) | 3h | Forum API |
| Backend: API report bài viết | 1h | Report API |
| Frontend: Trang diễn đàn (danh sách bài viết, infinite scroll) | 3h | `/forum` |
| Frontend: Trang chi tiết bài viết + comments | 3h | `/forum/:id` |
| Frontend: Form tạo bài viết (text + ảnh) | 2h | `/forum/new` |
| Frontend: Nút "Share lên diễn đàn" từ dashboard chủ trọ | 1h | Share button |
| Unit test: post.service | 1h | Test file |
| Integration test: post API | 1h | Test file |

**Checkpoint:** Diễn đàn hoạt động: xem/tạo bài, comment, report, share phòng trọ

---

## Tuần 9: Chatbot AI (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Backend: chatbot service (Gemini API integration) | 3h | Chatbot service |
| Backend: chatbot controller + route | 1h | `POST /api/chatbot/ask` |
| Backend: System prompt engineering (context phòng trọ, FAQ) | 2h | Tuned prompt |
| Frontend: Chatbot floating widget (button + popup chat) | 4h | Chatbot UI |
| Frontend: Chat history trong session (local state) | 1h | Chat history |
| Backend: Rate limit riêng cho chatbot (10 req/min) | 0.5h | Rate limit config |
| Test chatbot responses (manual + edge cases) | 1.5h | QA report |
| Bug fix tích luỹ từ tuần 7-8 | 2h | Fixes |

**Checkpoint:** Chatbot AI hoạt động, trả lời được FAQ và gợi ý tìm phòng

---

## Tuần 10: Admin Dashboard (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Backend: Admin API (list users, toggle active, list posts, hide post) | 3h | Admin API |
| Backend: Admin API (list reports, update report status) | 2h | Report management API |
| Backend: Aggregate queries (thống kê user, posts, rooms) | 2h | Stats API |
| Frontend: Admin layout + navigation | 1.5h | Admin layout |
| Frontend: Admin - User management table (search, filter, ban/unban) | 2.5h | `/admin/users` |
| Frontend: Admin - Post management table (hide/delete) | 2h | `/admin/posts` |
| Frontend: Admin - Report management table (review, resolve, dismiss) | 2h | `/admin/reports` |

**Checkpoint:** Admin có thể quản lý user, post, report qua giao diện

---

## Tuần 11: Admin Stats + Polish (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Frontend: Admin thống kê dashboard (Recharts: bar chart, line chart, cards) | 4h | `/admin` stats |
| Frontend: Responsive design (mobile breakpoints cho tất cả trang) | 4h | Mobile-friendly |
| Frontend: Dark mode toggle (TailwindCSS dark:) | 1h | Theme toggle |
| UI polish: loading states, empty states, error states | 2h | Better UX |
| Micro-animations: hover effects, page transitions | 2h | Smooth UX |
| Swagger docs: annotate tất cả route còn lại | 2h | Complete API docs |

**Checkpoint:** Admin dashboard hoàn chỉnh. UI responsive + polished.

---

## Tuần 12: Testing & Optimization (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Review + bổ sung unit tests (mục tiêu >50% coverage) | 3h | Coverage report |
| Bổ sung integration tests cho API chính | 2h | Integration tests |
| Seed data thực tế cho demo | 2h | Seed script |
| Performance: lazy loading images, code splitting | 2h | Better performance |
| Security review: check rate limit, XSS, auth edge cases | 1.5h | Security checklist |
| Bug fix + edge case handling | 2.5h | Stable build |
| README.md chi tiết (setup, architecture, screenshots) | 2h | README |

**Checkpoint:** App ổn định, test coverage đạt, seed data sẵn sàng demo

---

## Tuần 13: Báo cáo & Demo (15h)

| Task | Giờ | Deliverable |
|------|-----|------------|
| Viết báo cáo đồ án (nhấn mạnh kiến trúc, tech decisions, cross-cutting) | 7h | Báo cáo PDF |
| Chuẩn bị slide trình bày | 3h | Slide |
| Quay video demo các flow chính | 2h | Demo video |
| Rehearse trình bày + chuẩn bị trả lời câu hỏi hội đồng | 2h | Ready to present |
| Final deploy check + smoke test trên production | 1h | Production ready |

**Checkpoint:** ✅ **SẴN SÀNG BẢO VỆ ĐỒ ÁN**

---

# 12. ĐỀ XUẤT MỞ RỘNG (NẾU CÒN THỜI GIAN)

Các tính năng dưới đây **không nằm trong 13 tuần** nhưng có thể bổ sung nếu hoàn thành sớm hoặc phát triển tiếp sau đồ án:

| # | Tính năng | Độ khó | Thời gian thêm | Ghi chú |
|---|----------|--------|----------------|---------|
| 1 | **Đánh giá/Review nhà trọ (rating ⭐)** | ⭐⭐ | 8-10h | Thêm model Review + UI rating stars |
| 2 | **Notification badge** (tin nhắn mới, report) | ⭐⭐ | 6-8h | Polling 30s hoặc Supabase Realtime subscribe |
| 3 | **Social Login** (Google, Facebook) | ⭐ | 3-4h | Supabase Auth hỗ trợ sẵn |
| 4 | **Video call qua 3rd-party SDK** | ⭐⭐⭐ | 15-20h | Dùng Daily.co hoặc Agora SDK (có free tier) |
| 5 | **Chat nhóm** | ⭐⭐⭐ | 12-15h | Mở rộng ChatRoom type + member management |
| 6 | **PWA (Progressive Web App)** | ⭐⭐ | 5-8h | Service worker + manifest → cài được trên điện thoại |
| 7 | **Export báo cáo Admin (CSV/PDF)** | ⭐ | 4-5h | Dùng thư viện `jspdf` hoặc `json2csv` |

---

> [!TIP]
> ### Gợi ý "ghi điểm" khi bảo vệ đồ án
> 1. **Swagger docs live** → Mở cho hội đồng xem API documentation
> 2. **Seed data thực tế** → Demo với tên phòng trọ thật, giá thật, ảnh thật, toạ độ thật
> 3. **Error handling rõ ràng** → Khi hội đồng thử nhập sai, web hiển thị lỗi đẹp thay vì crash
> 4. **Git history sạch** → Conventional commits (`feat:`, `fix:`, `docs:`), branches theo feature
> 5. **Architecture diagram trong báo cáo** → Thể hiện tư duy thiết kế hệ thống
> 6. **Coverage report** → Cho thấy code đã được test
> 7. **README.md chi tiết** → Setup instructions, screenshots, tech decisions

---

*Tài liệu này là phiên bản chính thức dùng trong toàn bộ quá trình phát triển.*
*Cập nhật lần cuối: 2026-08-05*
