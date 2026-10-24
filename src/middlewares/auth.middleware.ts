import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../core/HttpError.js';
import type { AuthContext } from '../modules/auth/auth.types.js';
import { authService } from '../modules/auth/auth.service.js';

export async function authMiddleware(
  req: Request & Partial<AuthContext>,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw HttpError.unauthorized();

    const token = header.slice('Bearer '.length).trim();
    if (!token) throw HttpError.unauthorized();

    const user = await authService.verifyToken(token);
    req.user = { id: user.id, uuid: user.uuid, container: user.container };
    next();
  } catch (error) {
    next(error);
  }
}
