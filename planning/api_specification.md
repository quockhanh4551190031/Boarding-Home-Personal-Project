# TÀI LIỆU ĐẶC TẢ REST API (API SPECIFICATION)

**Dự án:** Mạng xã hội tìm phòng trọ
**Phiên bản:** 1.0 (Dựa trên Project Plan V2 & Database Spec)

Tài liệu này định nghĩa chi tiết các hợp đồng giao tiếp (API Contracts) giữa Frontend và Backend. Tất cả API đều nhận và trả về dữ liệu định dạng `application/json`.

---

## Cấu trúc Response chuẩn

**Thành công (Success):**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } // (Nếu là danh sách)
}
```

**Thất bại (Error):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User friendly message",
    "details": [...] // (Tuỳ chọn: Chi tiết lỗi validation)
  }
}
```

---

## 1. Module: Authentication (Internal)

*Lưu ý: Quá trình Login/Register do Client gọi trực tiếp Supabase. Backend chỉ hứng Webhook để đồng bộ.*

### 1.1. Đồng bộ người dùng mới
- **URL:** `/api/auth/sync`
- **Method:** `POST`
- **Auth:** Require Supabase Webhook Secret ở Header.
- **Rate Limit:** 10 req/min
- **Request Body:**
  ```json
  {
    "type": "INSERT",
    "record": {
      "id": "uuid",
      "email": "user@email.com",
      "raw_user_meta_data": { "role": "TENANT", "phone": "0123456789" }
    }
  }
  ```
- **Business Rule:** 
  - Chỉ nhận request từ Supabase.
  - Insert record mới vào bảng `User` public với role lấy từ metadata.
- **Response (200 OK):**
  ```json
  { "success": true, "data": { "id": "uuid", "email": "user@email.com" } }
  ```

---

## 2. Module: User

### 2.1. Lấy thông tin cá nhân
- **URL:** `/api/users/me`
- **Method:** `GET`
- **Auth:** Require Valid JWT
- **Role:** Bất kỳ
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "user-uuid",
      "email": "test@test.com",
      "phone": "0987654321",
      "fullName": "Nguyen Van A",
      "role": "TENANT",
      "isProfileComplete": true,
      "avatarUrl": "..."
    }
  }
  ```

### 2.2. Cập nhật hồ sơ (Onboarding/Edit)
- **URL:** `/api/users/me`
- **Method:** `PATCH`
- **Auth:** Require Valid JWT
- **Validation Rule:**
  - `phone`: Phải là số điện thoại VN hợp lệ (Zod regex).
  - `fullName`: String, min 2, max 50.
- **Request Body:**
  ```json
  {
    "fullName": "Nguyen Van A",
    "phone": "0987654321",
    "cccd": "001099000000"
  }
  ```
- **Business Rule:** Nếu cập nhật đủ `phone` và `fullName`, set `isProfileComplete = true`.
- **Response (200 OK):** Trả về thông tin user đã update.

---

## 3. Module: BoardingHouse & Room

### 3.1. Tạo Nhà trọ mới
- **URL:** `/api/boarding-houses`
- **Method:** `POST`
- **Auth:** Require Valid JWT
- **Role:** `LANDLORD`
- **Validation Rule:**
  - `lat`, `lng`: Phải là Float hợp lệ.
  - `name`: Min 5 ký tự.
- **Request Body:**
  ```json
  {
    "name": "Trọ Sinh Viên Quận 9",
    "address": "123 Lê Văn Việt",
    "ward": "Tăng Nhơn Phú A",
    "district": "Quận 9",
    "city": "HCM",
    "lat": 10.8480,
    "lng": 106.7865,
    "description": "Khu trọ an ninh, sạch sẽ."
  }
  ```
- **Business Rule:** Gán `ownerId` bằng ID của user đang đăng nhập. Insert vào database đồng thời kích hoạt trigger PostGIS tự động tạo tọa độ `geog`.
- **Response (201 Created):** Trả về ID của nhà trọ vừa tạo.

### 3.2. Tạo Phòng trọ mới
- **URL:** `/api/boarding-houses/:boardingHouseId/rooms`
- **Method:** `POST`
- **Auth:** Require Valid JWT
- **Role:** `LANDLORD`
- **Path Parameter:** `boardingHouseId` (UUID)
- **Validation Rule:**
  - `price`, `area`: Số dương (> 0).
  - `status`: "AVAILABLE" | "OCCUPIED".
  - `amenities`: Array các chuỗi.
- **Request Body:**
  ```json
  {
    "roomCode": "P101",
    "price": 2500000,
    "area": 20,
    "maxOccupants": 2,
    "amenities": ["wifi", "máy lạnh", "chỗ để xe"],
    "content": "Phòng rộng rãi, có gác xép.",
    "images": ["url_img_1", "url_img_2"]
  }
  ```
- **Business Rule:** 
  - User phải là chủ của nhà trọ `boardingHouseId`. Nếu không, trả lỗi `403 Forbidden`.
- **Response (201 Created):** Trả về dữ liệu phòng trọ.

---

## 4. Module: Search (Tìm kiếm)

### 4.1. Tìm phòng trọ gần vị trí
- **URL:** `/api/rooms/search`
- **Method:** `GET`
- **Auth:** Không yêu cầu (Public) hoặc Token tuỳ chọn.
- **Rate Limit:** 30 req/min (Query PostGIS nặng).
- **Query Parameter:**
  - `lat` (Float, required): Vĩ độ hiện tại.
  - `lng` (Float, required): Kinh độ hiện tại.
  - `radius` (Float, optional, default 5000): Bán kính mét.
  - `minPrice`, `maxPrice` (Float, optional).
  - `amenities` (String, optional): Ví dụ "wifi,máy lạnh" (comma-separated).
  - `page`, `limit` (Integer, default 1, 20).
- **Validation Rule:** `radius` <= 20000 (Max 20km).
- **Business Rule:**
  - Kết hợp bảng `Room` và `BoardingHouse`.
  - Dùng PostGIS `ST_DWithin` để lọc khoảng cách.
  - Sắp xếp theo khoảng cách `ST_Distance` tăng dần.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "room-uuid",
        "roomCode": "P101",
        "price": 2500000,
        "distance_meters": 1200,
        "boardingHouse": {
          "id": "bh-uuid",
          "name": "Trọ Sinh Viên",
          "lat": 10.8480,
          "lng": 106.7865
        }
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 50 }
  }
  ```

---

## 5. Module: Favorite

### 5.1. Thêm yêu thích
- **URL:** `/api/favorites`
- **Method:** `POST`
- **Auth:** Require Valid JWT
- **Request Body:**
  ```json
  {
    "boardingHouseId": "uuid-cua-nha-tro"
  }
  ```
- **Business Rule:** 
  - Nếu đã yêu thích rồi, bỏ qua hoặc trả thông báo đã yêu thích (tránh duplicate dựa vào composite unique key).
- **Response (201 Created)**

### 5.2. Lấy danh sách yêu thích
- **URL:** `/api/favorites`
- **Method:** `GET`
- **Auth:** Require Valid JWT
- **Query Parameter:** `page`, `limit`
- **Response (200 OK):** Danh sách các nhà trọ user đã lưu, sắp xếp giảm dần theo thời gian lưu.

### 5.3. Bỏ yêu thích
- **URL:** `/api/favorites/:boardingHouseId`
- **Method:** `DELETE`
- **Auth:** Require Valid JWT
- **Response (200 OK)**

---

## 6. Module: Report

### 6.1. Báo cáo vi phạm
- **URL:** `/api/reports`
- **Method:** `POST`
- **Auth:** Require Valid JWT
- **Rate Limit:** 5 req/min (chống spam report)
- **Request Body:**
  ```json
  {
    "targetType": "BOARDING_HOUSE",
    "targetId": "uuid-cua-nha-tro",
    "reason": "Phòng trọ này không có thật, lừa đảo cọc."
  }
  ```
- **Validation Rule:**
  - `targetType` in ["POST", "USER", "BOARDING_HOUSE"]
  - `reason` min 10 chars.
- **Business Rule:** 
  - Lưu vào DB với status `PENDING`.
- **Response (201 Created)**

---

## 7. Module: Notification

> [!NOTE]
> Theo Project Plan V2, chức năng **Notification Push Real-time** đã được loại bỏ khỏi MVP để giới hạn phạm vi công việc. 
> Thay vì vậy, Frontend sẽ sử dụng polling để đếm tin nhắn chưa đọc từ bảng `Message` (ví dụ `GET /api/chat/unread-count`).
> Sẽ không thiết kế REST API riêng cho hệ thống Notification (Thông báo chung) trong phiên bản này.

---

## 8. Module: Admin

### 8.1. Lấy danh sách người dùng
- **URL:** `/api/admin/users`
- **Method:** `GET`
- **Auth:** Require Valid JWT
- **Role:** `ADMIN` (Middleware kiểm tra req.user.role)
- **Query Parameter:** `role`, `isActive`, `page`, `limit`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "email": "landlord@test.com",
        "role": "LANDLORD",
        "isActive": true,
        "createdAt": "2026-08-05T00:00:00Z"
      }
    ],
    "meta": { ... }
  }
  ```
- **Error Response (403 Forbidden):** Nếu user gọi không phải ADMIN.
  ```json
  { "success": false, "error": { "code": "FORBIDDEN", "message": "Access denied" } }
  ```

### 8.2. Cập nhật trạng thái người dùng (Ban/Unban)
- **URL:** `/api/admin/users/:userId/status`
- **Method:** `PATCH`
- **Auth:** Require Valid JWT
- **Role:** `ADMIN`
- **Path Parameter:** `userId`
- **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```
- **Business Rule:** Không cho phép Admin tự khoá tài khoản của chính mình.
- **Response (200 OK):** `{ "success": true, "message": "Cập nhật thành công" }`

### 8.3. Duyệt Report
- **URL:** `/api/admin/reports/:reportId/status`
- **Method:** `PATCH`
- **Auth:** Require Valid JWT
- **Role:** `ADMIN`
- **Path Parameter:** `reportId`
- **Request Body:**
  ```json
  {
    "status": "RESOLVED",
    "adminNote": "Đã khoá nhà trọ lừa đảo này."
  }
  ```
- **Validation Rule:** `status` in ["REVIEWED", "RESOLVED", "DISMISSED"]
- **Response (200 OK):** Trả về report sau khi update.

---

## Mã lỗi phổ biến (Error Status Codes)

| Status Code | Mô tả | Xử lý ở Frontend |
|---|---|---|
| `400 Bad Request` | Dữ liệu gửi lên không đúng định dạng (Zod validation fail) | Đỏ form, hiển thị message lỗi bên dưới ô input. |
| `401 Unauthorized`| Token hết hạn hoặc sai | Tự động chuyển hướng về trang Đăng nhập. |
| `403 Forbidden` | Không có quyền (Role sai, hoặc không phải chủ nhà trọ) | Hiển thị màn hình 403 Access Denied. |
| `404 Not Found` | Không tìm thấy Room, Post... | Hiển thị màn hình 404. |
| `429 Too Many Req`| Bị chặn Rate limit | Hiển thị Toast thông báo chờ X giây. |
| `500 Server Error`| Lỗi nội bộ (Bug, DB sập) | Hiển thị thông báo "Hệ thống đang bận". |
