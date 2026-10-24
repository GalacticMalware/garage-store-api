import { z } from 'zod';

export const loginSchema = z.object({
  user: z.string({ required_error: 'El campo user es obligatorio' }).trim().min(1, 'El campo user es obligatorio'),
  password: z.string({ required_error: 'El campo password es obligatorio' }).min(1, 'El campo password es obligatorio'),
});

export type LoginDto = z.infer<typeof loginSchema>;
