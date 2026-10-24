import type { ResultSetHeader } from 'mysql2';
import { pool, query } from '../../infra/mysql.js';
import type { CreateStorageInput, StorageRow } from './storage.types.js';

export const storageRepository = {
  async create(input: CreateStorageInput): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO `storage` (uuid, user_id, name, url) VALUES (?, ?, ?, ?)',
      [input.uuid, input.userId, input.name, input.url],
    );
    return result.insertId;
  },

  async findById(id: number): Promise<StorageRow | null> {
    const rows = await query<StorageRow>(
      'SELECT id, uuid, user_id, name, url FROM `storage` WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ?? null;
  },
};
