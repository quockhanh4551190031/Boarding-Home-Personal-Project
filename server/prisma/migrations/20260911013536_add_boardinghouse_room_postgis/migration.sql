-- Sprint 2 — Task 2.1: PostGIS + BoardingHouse + Room

-- 1. PostGIS extension (bắt buộc có TRƯỚC khi khai báo cột geography)
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED');

-- CreateTable
CREATE TABLE "BoardingHouse" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ward" TEXT,
    "district" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "geog" geography(Point, 4326),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BoardingHouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "boardingHouseId" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price" DOUBLE PRECISION NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "maxOccupants" INTEGER,
    "amenities" JSONB,
    "content" TEXT,
    "images" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- 2. Trigger: tự động sinh geog từ (lng, lat) mỗi khi insert/update.
-- Prisma không ghi được cột Unsupported() nên bắt buộc dùng trigger.
CREATE OR REPLACE FUNCTION sync_boardinghouse_geog()
RETURNS TRIGGER AS $$
BEGIN
    -- ST_MakePoint(x, y) = ST_MakePoint(kinh độ lng, vĩ độ lat)
    NEW."geog" := ST_SetSRID(ST_MakePoint(NEW."lng", NEW."lat"), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "BoardingHouse_geog_sync"
BEFORE INSERT OR UPDATE ON "BoardingHouse"
FOR EACH ROW
EXECUTE FUNCTION sync_boardinghouse_geog();

-- 3. Indexes
-- GIST bắt buộc để ST_DWithin (Sprint 3 search) chạy nhanh
CREATE INDEX "BoardingHouse_geog_gist_idx" ON "BoardingHouse" USING GIST ("geog");

-- CreateIndex
CREATE INDEX "BoardingHouse_ownerId_idx" ON "BoardingHouse"("ownerId");

-- CreateIndex
CREATE INDEX "Room_boardingHouseId_idx" ON "Room"("boardingHouseId");

-- CreateIndex
CREATE INDEX "Room_price_idx" ON "Room"("price");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- AddForeignKey
ALTER TABLE "BoardingHouse" ADD CONSTRAINT "BoardingHouse_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_boardingHouseId_fkey" FOREIGN KEY ("boardingHouseId") REFERENCES "BoardingHouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
