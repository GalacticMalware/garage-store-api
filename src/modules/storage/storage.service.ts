import { randomUUID } from 'crypto';
import { env } from '../../config/env.js';
import { HttpError } from '../../core/HttpError.js';
import { uploadObject } from '../../infra/s3.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { storageRepository } from './storage.repository.js';
import type { StorageDto } from './storage.schema.js';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

interface DecodedImage {
  buffer: Buffer;
  mimeType: string;
  ext: string;
}

function decodeBase64Image(dataUri: string): DecodedImage {
  const match = dataUri.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/s);
  if (!match) throw HttpError.badRequest([{ field: 'imgbase64', message: 'El formato de imgbase64 es invalido' }]);

  const mimeType = match[1]!;
  const buffer = Buffer.from(match[2]!, 'base64');

  if (buffer.length === 0) {
    throw HttpError.badRequest([{ field: 'imgbase64', message: 'La imagen esta vacia o es invalida' }]);
  }
  if (buffer.length > env.storage.maxUploadBytes) throw HttpError.payloadTooLarge();

  const ext = EXT_BY_MIME[mimeType];
  if (!ext) throw HttpError.badRequest([{ field: 'imgbase64', message: 'Tipo de imagen no soportado' }]);

  return { buffer, mimeType, ext };
}

export const storageService = {
   async store(dto: StorageDto, currentUser: AuthenticatedUser): Promise<{ url: string }> {
    const image = decodeBase64Image(dto.imgbase64);

    const safeName = dto.name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60);
    // key = ruta DENTRO del bucket. El bucket lo elige el Host de Nginx (imagenes.danielmg-dev.icu).
    const key = `${randomUUID()}`;

    const { url } = await uploadObject(key, image.buffer, image.mimeType);
    // Relacion por user_id (id), aunque el token solo lleve uuid y container.
    await storageRepository.create({
      uuid: randomUUID(),
      userId: currentUser.id,
      name: dto.name,
      url,
    });

    return { url };
  },
};
