import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

export const s3 = new S3Client({
  endpoint: env.storage.endpoint,
  region: env.storage.region,
  credentials: {
    accessKeyId: env.storage.accessKey,
    secretAccessKey: env.storage.secretKey,
  },
  forcePathStyle: true, // OBLIGATORIO para Garage
});

export interface UploadedObject {
  key: string;
  url: string;
}

export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<UploadedObject> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.storage.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.length,
    }),
  );
  return { key, url: `${env.storage.publicBaseUrl}/${key}` };
}
