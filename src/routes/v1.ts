import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { storageRouter } from '../modules/storage/storage.routes.js';

export const v1Router = Router();

v1Router.use('/', authRouter);
v1Router.use('/storage', storageRouter);
