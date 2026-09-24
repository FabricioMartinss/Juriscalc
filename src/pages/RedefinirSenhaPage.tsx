/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import LayoutAuth from '../components/LayoutAuth';
import { API_URL } from '../contexts/AuthContext';

const TAMANHO_MIN_SENHA = 8;

export default function RedefinirSenhaPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha !== confirmar) {
      setErro('As senhas não conferem.');
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) throw new Error(corpo?.erro ?? 'Não foi possível redefinir a senha.');
      setPronto(true);
      // Some sozinho para o login depois de dar tempo de ler o aviso.
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.');
    } finally {
      setEnviando(false);
    }
  }

  // Link sem token: quem chegou aqui digitando o endereço, ou clicando num
  // link truncado pelo cliente de e-mail.
  if (!token) {
    return (
      <LayoutAuth titulo="Link inválido">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Este endereço não traz um link de redefinição válido. Peça um novo.</span>
        </div>
        <p className="text-xs text-slate-500 text-center">
          <Link to="/recuperar-senha" className="text-cyan-700 font-semibold hover:underline">
            Pedir novo link
          </Link>
        </p>
      </LayoutAuth>
    );
  }

  if (pronto) {
    return (
      <LayoutAuth titulo="Senha alterada">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Pronto! Entre com a senha nova.</span>
        </div>
        <p className="text-xs text-slate-500 text-center">
          <Link to="/login" className="text-cyan-700 font-semibold hover:underline">
            Ir para o login
          </Link>
        </p>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth titulo="Nova senha">
      <p className="text-xs text-slate-500 leading-relaxed">
        Escolha uma senha de pelo menos {TAMANHO_MIN_SENHA} caracteres.
      </p>

      <form onSubmit={aoSubmeter} className="space-y-4">
        <label className="block text-sm">
          <span className="text-slate-600 font-semibold">Nova senha</span>
          <input
            type="password"
            required
            autoFocus
            minLength={TAMANHO_MIN_SENHA}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-600 font-semibold">Confirmar nova senha</span>
          <input
            type="password"
            required
            minLength={TAMANHO_MIN_SENHA}
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
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
          {enviando ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </LayoutAuth>
  );
}
