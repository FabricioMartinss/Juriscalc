import { z } from 'zod';

export const cadastroSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo.').max(120),
  email: z.string().trim().toLowerCase().email('Email inválido.').max(160),
  telefone: z.string().trim().min(8, 'Telefone inválido.').max(20),
  oabNumero: z.string().trim().min(1, 'Informe o número da OAB.').max(20),
  oabUf: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, 'UF da OAB inválida.'),
  // bcrypt ignora além de 72 bytes — trava aqui pra não dar falsa sensação de senha mais forte.
  senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});
