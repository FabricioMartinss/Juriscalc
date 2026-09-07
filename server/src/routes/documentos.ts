import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { usuarioIdDaRequisicao } from '../lib/sessao.js';
import { extrairDadosProcesso } from '../lib/extrairDocumento.js';
import { asyncRota } from '../lib/asyncRota.js';

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

    const dados = await extrairDadosProcesso(
      req.file.buffer,
      req.file.mimetype as 'application/pdf' | 'image/jpeg' | 'image/png',
    );
    res.status(200).json({ dados });
  }),
);
