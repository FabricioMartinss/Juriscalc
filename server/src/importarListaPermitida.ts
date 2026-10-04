import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';

/**
 * Importa uma lista de e-mails liberados para cadastro (ver
 * migrations/005_lista_permitida.sql) a partir de um arquivo de texto: um
 * e-mail por linha (aceita .csv de uma coluna só -- vírgula, se houver, é
 * ignorada, só a primeira "célula" da linha conta).
 *
 * Uso:
 *   npm run lista-permitida -- caminho/arquivo.csv [origem]
 *
 * "origem" é livre (ex.: "oab-conecta-lote1") e só serve pra auditoria --
 * fica gravado em emails_permitidos.origem. Rodar de novo com o mesmo
 * arquivo não duplica nem apaga quem já estava liberado (ON CONFLICT DO
 * NOTHING): é seguro reenviar a lista inteira atualizada a cada lote.
 */
const [, , caminho, origem] = process.argv;

if (!caminho) {
  console.error('Uso: npm run lista-permitida -- caminho/arquivo.csv [origem]');
  process.exit(1);
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lerEmails(caminhoArquivo: string): string[] {
  const bruto = readFileSync(caminhoArquivo, 'utf-8');
  const emails: string[] = [];
  for (const linhaBruta of bruto.split(/\r?\n/)) {
    const primeiraCelula = linhaBruta.split(',')[0]?.trim().toLowerCase();
    if (!primeiraCelula || !REGEX_EMAIL.test(primeiraCelula)) continue;
    emails.push(primeiraCelula);
  }
  return emails;
}

const emails = lerEmails(caminho);
if (emails.length === 0) {
  console.error('Nenhum e-mail válido encontrado no arquivo.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

try {
  let novos = 0;
  for (const email of emails) {
    const resultado = await pool.query(
      'INSERT INTO emails_permitidos (email, origem) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
      [email, origem ?? null],
    );
    novos += resultado.rowCount ?? 0;
  }
  console.log(`${emails.length} e-mails no arquivo, ${novos} novos liberados (${emails.length - novos} já estavam na lista).`);
} finally {
  await pool.end();
}
