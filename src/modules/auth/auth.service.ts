import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { HttpError } from '../../core/HttpError.js';
import { userRepository } from './auth.repository.js';
import type { LoginDto } from './auth.schema.js';
import type { JwtPayload, UserRow } from './auth.types.js';

export const authService = {
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await userRepository.findByUserName(dto.user);
    if (!user) throw HttpError.invalidCredentials();

    const isPasswordValid = await bcrypt.compare(dto.password, user.hash);
    if (!isPasswordValid) throw HttpError.invalidCredentials();

    const payload: JwtPayload = { uuid: user.uuid, container: user.container };
    const options: SignOptions = { expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'] };
    const access_token = jwt.sign(payload, env.jwt.secret, options);

    return { access_token };
  },

  /** Verifica y decodifica el token; devuelve el usuario actual (con su id). */
  async verifyToken(token: string): Promise<UserRow> {
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
    } catch {
      throw HttpError.unauthorized();
    }

    const user = await userRepository.findByUuid(decoded.uuid);
    if (!user) throw HttpError.unauthorized();
    if (user.container !== decoded.container) throw HttpError.unauthorized();

    return user;
  },
};
