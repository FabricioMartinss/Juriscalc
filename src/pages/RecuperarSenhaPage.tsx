/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import LayoutAuth from '../components/LayoutAuth';
import { API_URL } from '../contexts/AuthContext';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/auth/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(corpo?.erro ?? 'Não foi possível enviar o link.');
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o link.');
    } finally {
      setEnviando(false);
    }
  }

  // O servidor responde igual para e-mail cadastrado e não cadastrado (para
  // não virar um verificador de quem tem conta), então esta tela também não
  // pode afirmar que o e-mail existe.
  if (enviado) {
    return (
      <LayoutAuth titulo="Verifique seu e-mail">
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Se houver uma conta com <strong>{email}</strong>, o link de redefinição chegou na caixa de
              entrada. Ele vale por 1 hora.
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Não chegou? Confira o spam ou{' '}
            <button
              type="button"
              onClick={() => setEnviado(false)}
              className="text-cyan-700 font-semibold hover:underline cursor-pointer"
            >
              tente outro e-mail
            </button>
            .
          </p>
          <p className="text-xs text-slate-500 text-center">
            <Link to="/login" className="text-cyan-700 font-semibold hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth titulo="Esqueci minha senha">
      <p className="text-xs text-slate-500 leading-relaxed">
        Informe o e-mail da sua conta. Enviamos um link para você escolher uma nova senha.
      </p>

      <form onSubmit={aoSubmeter} className="space-y-4">
        <label className="block text-sm">
          <span className="text-slate-600 font-semibold">Email</span>
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {enviando ? 'Enviando…' : 'Enviar link de redefinição'}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Lembrou a senha?{' '}
          <Link to="/login" className="text-cyan-700 font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </LayoutAuth>
  );
}
