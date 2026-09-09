import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateMeSchema } from "../schemas/user.schema.js";
import { getUserProfile, updateUserProfile } from "../services/user.service.js";

export const userRouter = Router();

/**
 * GET /api/users/me
 * Auth: JWT
 * Trả profile người dùng hiện tại. 404 nếu chưa đồng bộ public."User".
 */
userRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await getUserProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/users/me
 * Auth: JWT
 * Body: { phone?, fullName?, cccd? } (ít nhất 1 trường)
 * Set isProfileComplete=true khi phone + fullName đều hợp lệ.
 */
userRouter.patch(
  "/me",
  requireAuth,
  validate({ body: updateMeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await updateUserProfile(req.user!.id, req.body);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },
);
