/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Campos de e-mail/senha + submissão, compartilhados entre a página de login
 * (`/login`) e o modal que aparece quando as visitas livres acabam
 * (ModalLogin.tsx). Os dois precisam validar e errar igual; o que muda é só o
 * que acontece depois de entrar (navegar x fechar o modal) e o rodapé de links.
 */
export default function FormularioLogin({
  aoEntrar,
  rodape,
  autoFoco = false,
}: {
  /** Chamado depois de a sessão ser criada com sucesso. */
  aoEntrar: () => void;
  /** Links abaixo do botão (cadastro, esqueci a senha...). */
  rodape?: ReactNode;
  autoFoco?: boolean;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha);
      aoEntrar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="space-y-4">
      <label className="block text-sm">
        <span className="text-slate-600 font-semibold">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus={autoFoco}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </label>

      <label className="block text-sm">
        <span className="text-slate-600 font-semibold">Senha</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </label>

      {erro && (
        <p className="text-xs text-red-600 font-semibold" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full py-2.5 rounded-xl bg-[#0b2545] text-white font-bold text-sm hover:bg-[#0d2d54] disabled:opacity-50 cursor-pointer disabled:cursor-wait"
      >
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      {rodape}
    </form>
  );
}
