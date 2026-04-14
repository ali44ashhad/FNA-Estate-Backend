import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    void res;
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  };
}

