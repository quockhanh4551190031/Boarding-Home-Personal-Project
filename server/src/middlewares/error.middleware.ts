import type { ErrorRequestHandler } from "express";

import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

const isInvalidJsonError = (error: unknown): error is BodyParserError => {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const parserError = error as BodyParserError;
  return parserError.status === 400 && parserError.type === "entity.parse.failed";
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const normalizedError = isInvalidJsonError(error)
    ? new AppError(400, "INVALID_JSON", "Request body contains invalid JSON")
    : error;

  if (normalizedError instanceof AppError && normalizedError.isOperational) {
    req.log?.warn(
      {
        err: normalizedError,
        code: normalizedError.code,
        statusCode: normalizedError.statusCode,
      },
      normalizedError.message,
    );

    res.status(normalizedError.statusCode).json({
      success: false,
      error: {
        code: normalizedError.code,
        message: normalizedError.message,
        ...(normalizedError.details !== undefined
          ? { details: normalizedError.details }
          : {}),
      },
    });

    return;
  }

  const unexpectedError =
    normalizedError instanceof Error ? normalizedError : new Error("Unknown error");

  if (req.log) {
    req.log.error({ err: unexpectedError }, "Unexpected server error");
  } else {
    logger.error({ err: unexpectedError }, "Unexpected server error");
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
};
