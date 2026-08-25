import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';

/**
 * Roda `migrations/001_init.sql` contra o DATABASE_URL atual.
 *
 * Só um arquivo por enquanto — não vale um framework de migração pra uma
 * tabela só. Se crescer, revisitar.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const sql = readFileSync(path.join(__dirname, '..', 'migrations', '001_init.sql'), 'utf-8');

try {
  await pool.query(sql);
  console.log('Migração aplicada com sucesso.');
} finally {
  await pool.end();
}
