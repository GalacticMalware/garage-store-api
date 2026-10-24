import type { ZodTypeAny, z } from 'zod';
import { HttpError } from './HttpError.js';

/** Valida un payload contra un schema de zod y devuelve datos tipados. */
export function validate<TSchema extends ZodTypeAny>(schema: TSchema, payload: unknown): z.infer<TSchema> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    throw HttpError.badRequest(details);
  }
  return result.data;
}
