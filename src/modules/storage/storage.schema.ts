import { z } from 'zod';

const IMAGE_DATA_URI = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/;

export const storageSchema = z.object({
  name: z
    .string({ required_error: 'El campo name es obligatorio' })
    .trim()
    .min(1, 'El campo name es obligatorio')
    .max(255, 'El campo name no debe exceder 255 caracteres'),
  imgbase64: z
    .string({ required_error: 'El campo imgbase64 es obligatorio' })
    .min(1, 'El campo imgbase64 es obligatorio')
    .refine((value) => IMAGE_DATA_URI.test(value), {
      message: 'El formato de imgbase64 es invalido (debe ser data:image/...;base64,...)',
    }),
});

export type StorageDto = z.infer<typeof storageSchema>;
