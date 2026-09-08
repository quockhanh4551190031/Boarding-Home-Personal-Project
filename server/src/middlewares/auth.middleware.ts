import type { NextFunction, Request, Response } from "express";
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  errors as joseErrors,
  jwtVerify,
  type JWTPayload,
  type JWTHeaderParameters,
  type KeyLike,
} from "jose";

import { AppError } from "../utils/AppError.js";

export interface AuthUser {
  /** auth.users.id — đồng thời là khóa chính của public."User" */
  id: string;
  email?: string;
  phone?: string;
  /** Vai trò nghiệp vụ lưu trong user_metadata */
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface SupabaseJwtPayload extends JWTPayload {
  sub?: string;
  email?: string;
  phone?: string;

  user_metadata?: {
    phone?: string;
    role?: string;
  };

  app_metadata?: {
    role?: string;
  };
}

/**
 * Extract:
 *
 * Authorization: Bearer <token>
 */
const extractBearerToken = (header?: string): string | null => {
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return null;
  }

  return match[1].trim();
};

/**
 * Supabase hiện tại sử dụng ES256 cho JWT signing.
 *
 * JWKS:
 * https://<project>.supabase.co/auth/v1/.well-known/jwks.json
 */
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");

const jwksUrl = supabaseUrl
  ? new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
  : null;

const jwks = jwksUrl ? createRemoteJWKSet(jwksUrl) : null;

/**
 * Legacy Supabase project có thể vẫn sử dụng HS256.
 */
const getHs256Key = (): Uint8Array | null => {
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    return null;
  }

  return new TextEncoder().encode(secret);
};

/**
 * Chọn key dựa trên algorithm trong JWT header.
 *
 * QUAN TRỌNG:
 * alg được đọc bằng decodeProtectedHeader(),
 * KHÔNG dùng decodeJwt().
 */
const resolveVerification = (
  header: JWTHeaderParameters,
):
  | {
      key: KeyLike | Uint8Array | ReturnType<typeof createRemoteJWKSet>;
      algorithms: string[];
    }
  | null => {
  /**
   * Supabase ES256
   */
  if (header.alg === "ES256") {
    if (!jwks) {
      return null;
    }

    return {
      key: jwks,
      algorithms: ["ES256"],
    };
  }

  /**
   * Legacy HS256
   */
  if (header.alg === "HS256") {
    const key = getHs256Key();

    if (!key) {
      return null;
    }

    return {
      key,
      algorithms: ["HS256"],
    };
  }

  return null;
};

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  /**
   * 1. Lấy Bearer token
   */
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Thiếu access token",
      ),
    );

    return;
  }

  /**
   * 2. Kiểm tra server có cấu hình authentication hay chưa
   */
  if (!jwks && !getHs256Key()) {
    next(
      new AppError(
        500,
        "AUTH_NOT_CONFIGURED",
        "Máy chủ chưa cấu hình SUPABASE_URL hoặc SUPABASE_JWT_SECRET",
      ),
    );

    return;
  }

  /**
   * 3. Đọc JWT Protected Header
   *
   * KHÔNG dùng decodeJwt().
   */
  let header: JWTHeaderParameters;

  try {
    header = decodeProtectedHeader(token);
  } catch {
    next(
      new AppError(
        401,
        "INVALID_TOKEN",
        "Access token không hợp lệ",
      ),
    );

    return;
  }

  /**
   * 4. Chọn strategy verify
   */
  const strategy = resolveVerification(header);

  if (!strategy) {
    next(
      new AppError(
        401,
        "UNSUPPORTED_TOKEN_ALG",
        `Thuật toán token ${String(
          header.alg,
        )} không được hỗ trợ hoặc máy chủ thiếu cấu hình tương ứng`,
      ),
    );

    return;
  }

  /**
   * 5. Verify chữ ký + claims
   */
  try {
    const { payload } = await jwtVerify(
      token,
      strategy.key,
      {
        algorithms: strategy.algorithms,

        /**
         * Supabase Access Token:
         * aud = authenticated
         */
        audience: "authenticated",

        /**
         * Có thể bật issuer validation.
         *
         * Supabase issuer:
         * <SUPABASE_URL>/auth/v1
         */
        ...(supabaseUrl
          ? {
              issuer: `${supabaseUrl}/auth/v1`,
            }
          : {}),
      },
    );

    const claims = payload as SupabaseJwtPayload;

    /**
     * 6. sub bắt buộc phải tồn tại
     *
     * sub = auth.users.id
     */
    if (!claims.sub) {
      next(
        new AppError(
          401,
          "INVALID_TOKEN",
          "Access token không chứa user id",
        ),
      );

      return;
    }

    /**
     * 7. Gắn user vào Express Request
     */
    req.user = {
      id: claims.sub,
      email: claims.email,
      phone:
        claims.user_metadata?.phone ??
        claims.phone,
      role:
        claims.user_metadata?.role ??
        claims.app_metadata?.role,
    };

    /**
     * 8. Cho request đi tiếp
     */
    next();
  } catch (error) {
    /**
     * Token hết hạn
     */
    if (error instanceof joseErrors.JWTExpired) {
      next(
        new AppError(
          401,
          "TOKEN_EXPIRED",
          "Access token đã hết hạn",
        ),
      );

      return;
    }

    /**
     * Token không hợp lệ:
     * - signature sai
     * - audience sai
     * - issuer sai
     * - token malformed
     * - algorithm không đúng
     */
    next(
      new AppError(
        401,
        "INVALID_TOKEN",
        "Access token không hợp lệ hoặc đã hết hạn",
      ),
    );
  }
};