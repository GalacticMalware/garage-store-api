import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../core/HttpError.js';
import { HttpStatus, ResponseCode, ResponseMessage } from '../core/http.js';
import { sendError } from '../core/response.js';

interface MysqlError {
  code?: string;
}

function isMysqlError(error: unknown): error is MysqlError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, HttpStatus.NOT_FOUND, ResponseCode.E_404, ResponseMessage.NOT_FOUND);
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof HttpError) {
    sendError(res, error.status, error.code, error.message, error.details);
    return;
  }

  // Errores conocidos de MySQL / AWS S3
  if (isMysqlError(error) && (error.code === 'ER_DUP_ENTRY' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')) {
    if (error.code === 'ER_DUP_ENTRY') {
      sendError(res, HttpStatus.BAD_REQUEST, ResponseCode.E_400, ResponseMessage.BAD_REQUEST);
      return;
    }
    sendError(res, HttpStatus.SERVICE_UNAVAILABLE, ResponseCode.E_503, ResponseMessage.SERVICE_UNAVAILABLE);
    return;
  }

  console.error('[error]', error);
  sendError(res, HttpStatus.INTERNAL_ERROR, ResponseCode.E_500, ResponseMessage.INTERNAL_ERROR);
}
