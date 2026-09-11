import { Router, type NextFunction, type Request, type Response } from "express";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBoardingHouseSchema,
  updateBoardingHouseSchema,
} from "../schemas/boardingHouse.schema.js";
import {
  createBoardingHouse,
  deleteBoardingHouse,
  getMyBoardingHouse,
  listMyBoardingHouses,
  updateBoardingHouse,
} from "../services/boardingHouse.service.js";

export const boardingHouseRouter = Router();

// Mọi route nhà trọ đều yêu cầu: đăng nhập + role LANDLORD (hoặc ADMIN).
boardingHouseRouter.use(requireAuth, requireRole("LANDLORD", "ADMIN"));

/**
 * POST /api/boarding-houses
 * Tạo nhà trọ mới. ownerId lấy từ JWT (KHÔNG lấy từ body).
 */
boardingHouseRouter.post(
  "/",
  validate({ body: createBoardingHouseSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const house = await createBoardingHouse(req.user!.id, req.body);
      res.status(201).json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/boarding-houses
 * Danh sách nhà trọ của chính mình (dashboard chủ trọ).
 */
boardingHouseRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const houses = await listMyBoardingHouses(req.user!.id);
      res.json({ success: true, data: houses });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/boarding-houses/:id
 * Chi tiết 1 nhà trọ + danh sách phòng. 403 nếu không phải chủ.
 */
boardingHouseRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const house = await getMyBoardingHouse(req.params.id, req.user!.id);
      res.json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/boarding-houses/:id
 * Cập nhật từng phần. Trigger PostGIS tự cập nhật geog nếu đổi lat/lng.
 */
boardingHouseRouter.patch(
  "/:id",
  validate({ body: updateBoardingHouseSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const house = await updateBoardingHouse(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/boarding-houses/:id
 * Soft delete (set deletedAt). Room bên trong giữ nguyên trong DB.
 */
boardingHouseRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteBoardingHouse(req.params.id, req.user!.id);
      res.json({ success: true, data: { message: "Đã xoá nhà trọ" } });
    } catch (error) {
      next(error);
    }
  },
);
