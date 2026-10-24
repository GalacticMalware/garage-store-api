import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(authController.login));
