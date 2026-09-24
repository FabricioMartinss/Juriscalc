import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { usuarioIdDaRequisicao } from '../lib/sessao.js';
import { extrairDadosProcesso } from '../lib/extrairDocumento.js';
import { asyncRota } from '../lib/asyncRota.js';
import { LEITURAS_IA_GRATUITAS } from '../lib/limites.js';

export const documentosRouter = Router();

const TIPOS_ACEITOS = new Set(['application/pdf', 'image/jpeg', 'image/png']);

// memoryStorage: o arquivo nunca toca o disco. Sai de escopo (e da memória)
// assim que a resposta é enviada — nada de processo de escritório de
// advocacia pode ficar gravado em lugar nenhum.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, TIPOS_ACEITOS.has(file.mimetype));
  },
});

// Mais restritivo que o de login/cadastro: cada chamada aqui custa uma
// requisição paga à Anthropic, então o limite existe tanto por custo quanto
// por abuso.
const limitadorExtracao = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Envolve o multer pra devolver mensagem específica em vez de cair no
// handler genérico de erro (que responde só "erro interno").
function tratarUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('documento')(req, res, (erro: unknown) => {
    if (erro instanceof multer.MulterError) {
      if (erro.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ erro: 'Arquivo maior que 15MB.' });
        return;
      }
      res.status(400).json({ erro: 'Não foi possível processar o arquivo enviado.' });
      return;
    }
    if (erro) {
      next(erro);
      return;
    }
    next();
  });
}

documentosRouter.post(
  '/extrair',
  limitadorExtracao,
  tratarUpload,
  asyncRota(async (req, res) => {
    const usuarioId = usuarioIdDaRequisicao(req);
    if (!usuarioId) {
      res.status(401).json({ erro: 'Não autenticado.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ erro: 'Envie um PDF, JPG ou PNG de até 15MB.' });
      return;
    }

    // Toda conta ganha uma leitura gratuita; daí em diante é pago. O limite é
    // cobrado aqui, no servidor, e não no botão da tela: o front só decide o
    // que mostrar.
    const contagem = await pool.query<{ leituras_ia_usadas: number }>(
      'SELECT leituras_ia_usadas FROM usuarios WHERE id = $1',
      [usuarioId],
    );
    const usadas = contagem.rows[0]?.leituras_ia_usadas;
    if (usadas === undefined) {
      res.status(401).json({ erro: 'Não autenticado.' });
      return;
    }
    if (usadas >= LEITURAS_IA_GRATUITAS) {
      res.status(402).json({
        erro: 'Sua leitura gratuita já foi usada. Escolha um plano para continuar lendo documentos.',
        leiturasIaUsadas: usadas,
        leiturasIaGratuitas: LEITURAS_IA_GRATUITAS,
      });
      return;
    }

    const dados = await extrairDadosProcesso(
      req.file.buffer,
      req.file.mimetype as 'application/pdf' | 'image/jpeg' | 'image/png',
    );

    // Só desconta leitura que entregou dados. Arquivo recusado pelo porteiro
    // (não é documento de processo) costuma ser engano de quem enviou, e
    // queimar a única leitura gratuita num engano é o caminho mais curto para
    // a pessoa não voltar. O custo dessas chamadas fica coberto pelo
    // limitador acima.
    let leiturasIaUsadas = usadas;
    if (dados.pareceProcessoJudicial) {
      const atualizado = await pool.query<{ leituras_ia_usadas: number }>(
        'UPDATE usuarios SET leituras_ia_usadas = leituras_ia_usadas + 1 WHERE id = $1 RETURNING leituras_ia_usadas',
        [usuarioId],
      );
      leiturasIaUsadas = atualizado.rows[0]?.leituras_ia_usadas ?? usadas + 1;
    }

    res.status(200).json({ dados, leiturasIaUsadas, leiturasIaGratuitas: LEITURAS_IA_GRATUITAS });
  }),
);
