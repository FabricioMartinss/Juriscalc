import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { documentosRouter } from './routes/documentos.js';

const app = express();

const origensPermitidas = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: origensPermitidas,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

app.get('/', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/documentos', documentosRouter);

// Rede de segurança: qualquer erro não tratado nas rotas (banco fora do ar,
// etc.) cai aqui em vez de virar unhandled rejection e derrubar o processo.
// Nunca loga `req.body` — pode conter a senha em texto puro.
app.use((erro: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro não tratado:', erro instanceof Error ? erro.message : erro);
  res.status(500).json({ erro: 'Erro interno. Tente novamente em instantes.' });
});

const porta = Number(process.env.PORT) || 4000;
app.listen(porta, () => {
  console.log(`API rodando na porta ${porta}`);
});
