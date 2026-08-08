import type { RequestHandler } from "express";
import type { ZodIssue, ZodTypeAny } from "zod";

import { AppError } from "../utils/AppError.js";

type RequestPart = "body" | "query" | "params";

type RequestSchemas = Partial<Record<RequestPart, ZodTypeAny>>;

interface ValidationDetail {
  field: string;
  message: string;
  code: string;
}

const requestParts: RequestPart[] = ["params", "query", "body"];

const formatIssue = (part: RequestPart, issue: ZodIssue): ValidationDetail => ({
  field: [part, ...issue.path].join("."),
  message: issue.message,
  code: issue.code,
});

export const validate = (schemas: RequestSchemas): RequestHandler => {
  return async (req, _res, next) => {
    try {
      const validationResults = await Promise.all(
        requestParts.map(async (part) => {
          const schema = schemas[part];

          if (!schema) {
            return null;
          }

          return {
            part,
            result: await schema.safeParseAsync(req[part]),
          };
        }),
      );

      const details = validationResults.flatMap((validation) => {
        if (!validation || validation.result.success) {
          return [];
        }

        return validation.result.error.issues.map((issue) =>
          formatIssue(validation.part, issue),
        );
      });

      if (details.length > 0) {
        next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "Request validation failed",
            details,
          ),
        );
        return;
      }

      for (const validation of validationResults) {
        if (validation?.result.success) {
          req[validation.part] = validation.result.data;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
