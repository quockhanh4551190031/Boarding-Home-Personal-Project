# KẾ HOẠCH SPRINT (SPRINT PLANNING)

**Vai trò thực hiện:** Technical Lead
**Dự án:** Mạng xã hội tìm phòng trọ
**Thời lượng:** 13 Tuần (Chia thành 7 Sprint)
**Nhân sự:** 1 Sinh viên (~15 giờ/tuần)

Tài liệu này chia nhỏ khối lượng công việc từ Project Plan V2 thành các Sprint cụ thể dựa trên sự phụ thuộc của các module (Database & Architecture). Mục tiêu là hoàn thành phiên bản **MVP (Sản phẩm khả dụng tối thiểu)** ngay tại Sprint 4 để đảm bảo an toàn tiến độ đồ án, các Sprint sau sẽ là tính năng nâng cao và hoàn thiện.

---

## LÝ DO SẮP XẾP THỨ TỰ SPRINT (DEPENDENCY GRAPH)

Thứ tự các Sprint được thiết kế hoàn toàn dựa trên sự phụ thuộc logic của Database và luồng nghiệp vụ (Business Flow):
1. Không có môi trường và Database $\rightarrow$ Không thể code (Sprint 1).
2. Không có `User` (Auth) $\rightarrow$ Không thể phân quyền hay tạo dữ liệu khác (Sprint 1).
3. Không có `BoardingHouse` và `Room` $\rightarrow$ Không có gì để tìm kiếm (Sprint 2 phải đi trước Sprint 3).
4. Không có tính năng Tìm kiếm và Xem chi tiết $\rightarrow$ Người thuê trọ không biết chọn ai để Chat (Sprint 3 đi trước Sprint 4).
5. Sau Sprint 4, hai luồng người dùng (Tìm trọ và Chủ trọ) đã giao tiếp được với nhau $\rightarrow$ MVP hoàn thành.
6. Khi MVP đã chạy ổn định, mới bổ sung Diễn đàn, AI (Sprint 5) và Admin (Sprint 6) vì các module này phụ thuộc dữ liệu vào toàn bộ hệ thống lõi.

---

## 🚀 SPRINT 1: Nền tảng & Xác thực (Tuần 1 - 2)

**1. Mục tiêu (Goal):** 
Khởi tạo thành công kiến trúc Monorepo, kết nối hệ sinh thái Supabase và hoàn thiện luồng đăng nhập/đăng ký cho người dùng.

**2. Chức năng thực hiện:**
- Thiết kế UI/UX cơ bản trên Figma.
- Setup Vercel (Frontend), Supabase (Postgres, Auth).
- Áp dụng các cross-cutting concerns: Middleware, Zod Validation, Pino Logging, Error Handling.
- Tính năng: Đăng nhập/Đăng ký qua Supabase Auth, Webhook đồng bộ User về Database, Hoàn thiện hồ sơ (SĐT, Họ tên).

**3. Các module liên quan:**
- Setup & DevOps
- Authentication Module
- User Module

**4. Đầu ra mong đợi (Expected Output):**
- Mã nguồn đã push lên GitHub, CI/CD chạy tự động.
- App đã deploy lên Vercel.
- Đăng ký tài khoản trên web $\rightarrow$ Data lưu vào Supabase Auth $\rightarrow$ Webhook lưu vào bảng `User`.

**5. Definition of Done (DoD):**
- [ ] Setup đủ thư mục `client`, `server`, `shared`.
- [ ] API `/api/auth/sync` hoạt động và pass Unit Test.
- [ ] API `/api/users/me` hoạt động.
- [ ] Giao diện Đăng nhập/Đăng ký không lỗi màn hình trắng, có validate dữ liệu (báo đỏ nếu nhập sai email).

---

## 🏗 SPRINT 2: Cốt lõi Chủ Trọ (Tuần 3 - 4)

**1. Mục tiêu (Goal):** 
Xây dựng công cụ cho Chủ trọ (Landlord) tạo ra dữ liệu phòng trọ cho nền tảng. Xử lý thành công việc Upload file và kích hoạt PostGIS.

**2. Chức năng thực hiện:**
- Dashboard quản lý của Chủ trọ.
- API & UI tạo/sửa/xoá Nhà trọ (`BoardingHouse`). Tích hợp bản đồ Leaflet để Chủ trọ click chọn toạ độ.
- API & UI tạo/sửa/xoá Phòng trọ (`Room`).
- Upload hình ảnh phòng trọ lên Supabase Storage qua Backend Multer.

**3. Các module liên quan:**
- Room Management Module (BoardingHouse, Room)
- Upload Module

**4. Đầu ra mong đợi (Expected Output):**
- Chủ trọ có thể đăng nhập, tạo một khu nhà trọ mới, chấm toạ độ trên bản đồ và thêm các phòng trọ kèm hình ảnh/giá cả.
- Trigger SQL của PostGIS tự động sinh ra dữ liệu cột `geog` thành công trong DB.

**5. Definition of Done (DoD):**
- [ ] Giao diện Dashboard Chủ trọ render danh sách nhà trọ.
- [ ] Upload được ảnh < 4MB, chặn các file không phải hình ảnh.
- [ ] Dữ liệu lưu vào DB đầy đủ khoá ngoại `ownerId`.
- [ ] API trả về lỗi 403 nếu User role là `TENANT` cố tình gọi API tạo phòng.

---

## 🔍 SPRINT 3: Cốt lõi Người Tìm Trọ (Tuần 5 - 6)

**1. Mục tiêu (Goal):** 
Xây dựng trải nghiệm tìm kiếm không gian cho Người tìm trọ (Tenant) bằng sức mạnh của PostGIS.

**2. Chức năng thực hiện:**
- Lấy vị trí GPS tự động của người dùng (Browser Geolocation).
- API Search sử dụng `ST_DWithin` của PostGIS để tìm các nhà trọ trong bán kính 5km.
- Giao diện Trang chủ (Feed + Bản đồ marker).
- Bộ lọc nâng cao: khoảng giá, tiện ích, bán kính.
- Trang chi tiết phòng trọ (Carousel ảnh, thông tin chủ trọ).
- Tính năng Lưu yêu thích (`Favorite`).

**3. Các module liên quan:**
- Search & Geo Module
- Favorite Module

**4. Đầu ra mong đợi (Expected Output):**
- User vào web $\rightarrow$ Web xin quyền vị trí $\rightarrow$ Hiện ra danh sách và bản đồ các phòng trọ xung quanh user, sort theo khoảng cách mét.
- User có thể bấm vào phòng $\rightarrow$ Xem chi tiết $\rightarrow$ Bấm nút "Yêu thích".

**5. Definition of Done (DoD):**
- [ ] API Search phải paginate (phân trang).
- [ ] Rate Limit (30 req/min) hoạt động tốt để bảo vệ DB khỏi spam query PostGIS.
- [ ] Giao diện bản đồ hiển thị đúng vị trí (Marker) của các nhà trọ.
- [ ] Unit Test/Integration Test cho API Search hoạt động.

---

## 💬 SPRINT 4: Kết nối Realtime (Tuần 7)

**1. Mục tiêu (Goal):** 
Khép lại vòng đời MVP bằng cách kết nối người tìm và chủ trọ thông qua tính năng Chat Realtime.

**2. Chức năng thực hiện:**
- Cấu hình Supabase Realtime SDK trên Frontend.
- Bảng `ChatRoom`, `ChatRoomMember`, `Message`.
- Giao diện list hội thoại và cửa sổ Chat.
- Tính năng: Gửi/nhận tin nhắn không cần F5, Trạng thái Typing, Đếm số tin chưa đọc.

**3. Các module liên quan:**
- Realtime Chat Module

**4. Đầu ra mong đợi (Expected Output):**
- Từ Trang chi tiết phòng, Tenant bấm "Nhắn tin" $\rightarrow$ Mở cửa sổ chat với Landlord.
- Cả 2 có thể nhắn tin qua lại mượt mà, DB lưu lại lịch sử tin nhắn.

**5. Definition of Done (DoD):**
- [ ] 🎉 **HOÀN THÀNH MVP.** Sản phẩm đủ khả năng demo end-to-end.
- [ ] Cuộn chuột lên trên cửa sổ chat $\rightarrow$ Tự động load thêm lịch sử tin cũ (Cursor Pagination).
- [ ] Không rò rỉ (leak) memory khi subscribe/unsubscribe Realtime channel trên React useEffect.

---

## 🤖 SPRINT 5: Diễn đàn & AI (Tuần 8 - 9)

**1. Mục tiêu (Goal):** 
Tăng tính tương tác (social) cho mạng xã hội và thêm yếu tố "wow-factor" cho đồ án bằng AI.

**2. Chức năng thực hiện:**
- Bảng `Post`, `Comment`.
- Giao diện Diễn đàn (Đăng bài, Bình luận).
- Tích hợp Gemini API: Chatbot hỗ trợ nổi ở góc phải màn hình, thiết kế System Prompt để bot hướng dẫn dùng web và trả lời câu hỏi mẫu.

**3. Các module liên quan:**
- Forum Module
- AI Chatbot Module

**4. Đầu ra mong đợi (Expected Output):**
- Người dùng có thể chia sẻ kinh nghiệm thuê trọ hoặc Landlord bấm "Share" phòng trọ lên diễn đàn.
- Người dùng mở Chatbot hỏi "Làm sao để đăng bài?" $\rightarrow$ Bot trả lời đúng context.

**5. Definition of Done (DoD):**
- [ ] API Chatbot có Rate Limit gắt (10 req/min) để tránh hết token free của Google.
- [ ] Xoá bài đăng (Soft Delete) thì các bình luận bên dưới cũng bị ẩn đi theo (Cascade logic).

---

## 🛡️ SPRINT 6: Quản trị & Điều hành (Tuần 10 - 11)

**1. Mục tiêu (Goal):** 
Cung cấp công cụ cho Admin kiểm duyệt dữ liệu rác và theo dõi sức khỏe nền tảng.

**2. Chức năng thực hiện:**
- Chức năng Báo cáo vi phạm (`Report`). User có thể report Phòng trọ ảo hoặc Bài viết độc hại.
- Giao diện Admin Dashboard (được bảo vệ bởi `Role Middleware`).
- Quản lý User (Ban/Unban).
- Thống kê biểu đồ (Recharts): Tổng user, số phòng đang trống, v.v.

**3. Các module liên quan:**
- Report & Moderation Module
- Admin Dashboard Module

**4. Đầu ra mong đợi (Expected Output):**
- Giao diện Admin riêng biệt, an toàn.
- Admin có thể duyệt report, khoá tài khoản lừa đảo, làm sạch môi trường.

**5. Definition of Done (DoD):**
- [ ] Không có tài khoản `TENANT` hay `LANDLORD` nào có thể truy cập `/api/admin/*` (Báo lỗi 403 Forbidden).
- [ ] API Thống kê trả về dữ liệu aggregate (GROUP BY) chính xác.

---

## 🎁 SPRINT 7: Hoàn thiện & Bảo vệ đồ án (Tuần 12 - 13)

**1. Mục tiêu (Goal):** 
Làm cho sản phẩm "sáng bóng" nhất có thể để sẵn sàng cho hội đồng chấm điểm, xử lý các corner cases và tài liệu.

**2. Chức năng thực hiện:**
- Polish UI/UX: Thêm Skeleton Loading, Empty States (Không có dữ liệu), Toast Notifications.
- Responsive toàn bộ web (Mobile-first).
- Sinh Seed Data thực tế (Tên nhà trọ thật, giá thật, toạ độ thật ở HCM/HN).
- Hoàn thiện Swagger API Docs (`/api/docs`).
- Chạy toàn bộ Test Suite, đo Coverage.

**3. Đầu ra mong đợi (Expected Output):**
- Website không bị vỡ giao diện trên điện thoại.
- Hội đồng xem link web và thấy một sản phẩm chuyên nghiệp như thật với dữ liệu sống động.
- Tài liệu Báo cáo đồ án (Word/PDF) và Slide thuyết trình.

**4. Definition of Done (DoD):**
- [ ] 0 bugs nghiêm trọng (Critical/High).
- [ ] Test coverage Backend đạt > 50%.
- [ ] Các tính năng demo trên Vercel chạy mượt mà, không gặp lỗi Timeout 10s của Serverless.
- [ ] Sẵn sàng bảo vệ.
