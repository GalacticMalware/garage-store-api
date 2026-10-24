import type { Request, Response } from 'express';
import { ResponseCode, ResponseMessage, HttpStatus } from '../../core/http.js';
import { sendSuccess } from '../../core/response.js';
import { validate } from '../../core/validate.js';
import { loginSchema } from './auth.schema.js';
import { authService } from './auth.service.js';

export const authController = {
  login: async (req: Request, res: Response): Promise<void> => {
    const dto = validate(loginSchema, req.body);
    const data = await authService.login(dto);
    sendSuccess(res, HttpStatus.OK, ResponseCode.S_200, ResponseMessage.LOGIN_SUCCESS, data);
  },
};
