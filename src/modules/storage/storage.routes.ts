import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { storageController } from './storage.controller.js';

export const storageRouter = Router();

storageRouter.post('/', authMiddleware, asyncHandler(storageController.store));
