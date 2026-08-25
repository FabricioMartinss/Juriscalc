/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { de?: string } | null)?.de ?? '/app';

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
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-cyan-50/40 via-slate-50 to-blue-50/40 px-4">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-cyan-400 rounded-xl flex items-center justify-center text-[#0b2545]">
          <Scale className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <span className="font-sans font-black text-[#0b2545] tracking-tight uppercase">
          Juriscalc<span className="text-cyan-600">SP</span>
        </span>
      </Link>

      <form
        onSubmit={aoSubmeter}
        className="w-full max-w-sm bg-white rounded-3xl shadow-lg shadow-blue-950/5 border border-slate-100 p-6 space-y-4"
      >
        <h1 className="font-sans font-bold text-lg text-[#0b2545]">Entrar</h1>

        <label className="block text-sm">
          <span className="text-slate-600 font-semibold">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
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

        <p className="text-xs text-slate-500 text-center">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-cyan-700 font-semibold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
