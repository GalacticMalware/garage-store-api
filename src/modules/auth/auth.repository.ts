import { query } from '../../infra/mysql.js';
import type { UserRow } from './auth.types.js';

export const userRepository = {
  /** Busca al usuario por user_name (login). Las relaciones en DB usan id. */
  async findByUserName(userName: string): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      'SELECT id, uuid, user_name, container, hash FROM `user` WHERE user_name = ? LIMIT 1',
      [userName],
    );
    return rows[0] ?? null;
  },

  /** Busca al usuario por uuid (usado al validar el token). */
  async findByUuid(uuid: string): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      'SELECT id, uuid, user_name, container, hash FROM `user` WHERE uuid = ? LIMIT 1',
      [uuid],
    );
    return rows[0] ?? null;
  },
};
