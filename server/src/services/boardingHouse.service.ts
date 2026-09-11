import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateBoardingHouseInput,
  UpdateBoardingHouseInput,
} from "../schemas/boardingHouse.schema.js";

/**
 * BoardingHouse service — nghiệp vụ nhà trọ.
 *
 * Quy tắc ownership: mọi thao tác sửa/xoá đều phải truyền ownerId (lấy từ JWT,
 * KHÔNG trust body). Không đúng chủ → 403 FORBIDDEN.
 *
 * Lưu ý: cột `geog` do trigger PostGIS tự sinh, Prisma không ghi trường này.
 */

/** Lấy 1 nhà trọ còn hoạt động (chưa soft-delete). */
const findActive = (id: string) =>
  prisma.boardingHouse.findFirst({
    where: { id, deletedAt: null },
  });

export async function createBoardingHouse(
  ownerId: string,
  input: CreateBoardingHouseInput,
) {
  return prisma.boardingHouse.create({
    data: { ...input, ownerId },
  });
}

/** Danh sách nhà trọ của chính chủ trọ đang đăng nhập (+ số phòng còn trống). */
export async function listMyBoardingHouses(ownerId: string) {
  return prisma.boardingHouse.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      rooms: {
        where: { deletedAt: null },
        select: { id: true, roomCode: true, price: true, status: true },
      },
    },
  });
}

export async function getMyBoardingHouse(id: string, ownerId: string) {
  const house = await findActive(id);
  if (!house) {
    throw new AppError(404, "BOARDING_HOUSE_NOT_FOUND", "Không tìm thấy nhà trọ");
  }
  if (house.ownerId !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không phải chủ nhà trọ này");
  }
  return prisma.boardingHouse.findUnique({
    where: { id },
    include: { rooms: { where: { deletedAt: null } } },
  });
}

export async function updateBoardingHouse(
  id: string,
  ownerId: string,
  input: UpdateBoardingHouseInput,
) {
  const house = await findActive(id);
  if (!house) {
    throw new AppError(404, "BOARDING_HOUSE_NOT_FOUND", "Không tìm thấy nhà trọ");
  }
  if (house.ownerId !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không phải chủ nhà trọ này");
  }
  // Trigger PostGIS sẽ tự cập nhật geog nếu lat/lng thay đổi.
  return prisma.boardingHouse.update({ where: { id }, data: input });
}

/** Soft delete — set deletedAt, không xoá vật lý (giữ lại để đối soát). */
export async function deleteBoardingHouse(id: string, ownerId: string) {
  const house = await findActive(id);
  if (!house) {
    throw new AppError(404, "BOARDING_HOUSE_NOT_FOUND", "Không tìm thấy nhà trọ");
  }
  if (house.ownerId !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không phải chủ nhà trọ này");
  }
  return prisma.boardingHouse.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
