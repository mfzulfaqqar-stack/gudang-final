import { Pool } from 'pg';
const globalForPg = globalThis;
export const pool =
    globalForPg.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;
export const query = (text, params) => pool.query(text, params);

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}