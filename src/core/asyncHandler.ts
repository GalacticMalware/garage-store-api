import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Envuelve controladores async para delegar errores al error handler. */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };
