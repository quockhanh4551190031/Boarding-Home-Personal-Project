// Prisma v7+: Connection URLs được cấu hình ở đây thay vì schema.prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma Migrate sử dụng url này.
    // Phải là DIRECT_URL (port 5432) để bypass PgBouncer khi tạo bảng.
    url: process.env["DIRECT_URL"]!,
  },
});
