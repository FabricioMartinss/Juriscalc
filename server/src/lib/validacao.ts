import { z } from 'zod';

// oabNumero/oabUf são opcionais — nem todo usuário da plataforma tem OAB
// (ex: estagiários). Mas vêm juntos ou ficam os dois em branco: não faz
// sentido um número sem UF ou vice-versa.
export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(3, 'Informe o nome completo.').max(120),
    email: z.string().trim().toLowerCase().email('Email inválido.').max(160),
    telefone: z.string().trim().min(8, 'Telefone inválido.').max(20),
    oabNumero: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((valor) => valor || undefined),
    oabUf: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .transform((valor) => valor || undefined),
    // bcrypt ignora além de 72 bytes — trava aqui pra não dar falsa sensação de senha mais forte.
    senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72),
  })
  .refine((dados) => Boolean(dados.oabNumero) === Boolean(dados.oabUf), {
    message: 'Informe número e UF da OAB juntos, ou deixe os dois em branco.',
    path: ['oabUf'],
  })
  .refine((dados) => !dados.oabUf || dados.oabUf.length === 2, {
    message: 'UF da OAB inválida.',
    path: ['oabUf'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});
