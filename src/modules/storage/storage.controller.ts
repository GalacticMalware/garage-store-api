import type { Request, Response } from 'express';
import { HttpStatus, ResponseCode, ResponseMessage } from '../../core/http.js';
import { HttpError } from '../../core/HttpError.js';
import { sendSuccess } from '../../core/response.js';
import { validate } from '../../core/validate.js';
import type { AuthContext } from '../auth/auth.types.js';
import { storageSchema } from './storage.schema.js';
import { storageService } from './storage.service.js';

export const storageController = {
  store: async (req: Request & Partial<AuthContext>, res: Response): Promise<void> => {
    const dto = validate(storageSchema, req.body);
    if (!req.user) throw HttpError.unauthorized();

    const data = await storageService.store(dto, req.user);
    sendSuccess(res, HttpStatus.OK, ResponseCode.S_200, ResponseMessage.STORAGE_SUCCESS, data);
  },
};
