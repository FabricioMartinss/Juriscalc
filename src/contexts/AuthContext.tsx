/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  oabNumero: string | null;
  oabUf: string | null;
}

export interface CadastroInput {
  nome: string;
  email: string;
  telefone: string;
  oabNumero?: string;
  oabUf?: string;
  senha: string;
}

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: CadastroInput) => Promise<void>;
  sair: () => Promise<void>;
}

// Em produção, configurada nas variáveis de ambiente do Netlify (build-time,
// por isso VITE_ na frente). Sem ela, cai no backend local de desenvolvimento.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function chamarApi(caminho: string, opcoes?: RequestInit) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    credentials: 'include', // manda/recebe o cookie de sessão entre juriscalcsp.com e api.juriscalcsp.com
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(corpo?.erro ?? 'Não foi possível completar a operação.');
  }
  return corpo;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    chamarApi('/api/auth/me')
      .then((corpo) => setUsuario(corpo.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  async function login(email: string, senha: string) {
    const corpo = await chamarApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    setUsuario(corpo.usuario);
  }

  async function cadastrar(dados: CadastroInput) {
    const corpo = await chamarApi('/api/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    setUsuario(corpo.usuario);
  }

  async function sair() {
    await chamarApi('/api/auth/logout', { method: 'POST' });
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, cadastrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return contexto;
}
