import type { Response } from 'express';

export interface ApiResponse<T> {
  code: string;
  message: string;
  data?: T;
}

export function sendSuccess<T>(res: Response, status: number, code: string, message: string, data: T): void {
  const body: ApiResponse<T> = { code, message, data };
  res.status(status).json(body);
}

export function sendError(res: Response, status: number, code: string, message: string, details?: unknown): void {
  const body: ApiResponse<unknown> = { code, message };
  if (details !== undefined) body.data = details;
  res.status(status).json(body);
}
