import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';

/**
 * Roda todos os arquivos de `migrations/*.sql`, em ordem alfabética, contra o
 * DATABASE_URL atual. Sem framework de migração nem tabela de controle — cada
 * arquivo precisa ser escrito de forma idempotente (IF NOT EXISTS etc.) pra
 * rodar de novo sem erro.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const diretorioMigracoes = path.join(__dirname, '..', 'migrations');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const arquivos = readdirSync(diretorioMigracoes)
  .filter((nome) => nome.endsWith('.sql'))
  .sort();

try {
  for (const arquivo of arquivos) {
    const sql = readFileSync(path.join(diretorioMigracoes, arquivo), 'utf-8');
    await pool.query(sql);
    console.log(`Migração ${arquivo} aplicada.`);
  }
  console.log('Migração aplicada com sucesso.');
} finally {
  await pool.end();
}
