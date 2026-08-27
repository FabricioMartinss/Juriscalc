/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ESTADOS_BR } from '../data/estadosBrasil';

export default function CadastroPage() {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [temOab, setTemOab] = useState(true);
  const [oabNumero, setOabNumero] = useState('');
  const [oabUf, setOabUf] = useState('SP');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem.');
      return;
    }

    setEnviando(true);
    try {
      await cadastrar({
        nome,
        email,
        telefone,
        oabNumero: temOab ? oabNumero : undefined,
        oabUf: temOab ? oabUf : undefined,
        senha,
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-cyan-50/40 via-slate-50 to-blue-50/40 px-4 py-10">
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
        <h1 className="font-sans font-bold text-lg text-[#0b2545]">Criar conta</h1>

        <label className="block text-sm">
          <span className="text-slate-600 font-semibold">Nome completo</span>
          <input
            type="text"
            required
            minLength={3}
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </label>

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
          <span className="text-slate-600 font-semibold">Telefone</span>
          <input
            type="tel"
            required
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </label>

        <div className="text-sm">
          <label className="flex items-center gap-2 text-slate-600 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={temOab}
              onChange={(e) => setTemOab(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-400 cursor-pointer"
            />
            Tenho número da OAB
          </label>

          {temOab && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              <label className="block col-span-2">
                <span className="text-slate-600 font-semibold">Número da OAB</span>
                <input
                  type="text"
                  required={temOab}
                  value={oabNumero}
                  onChange={(e) => setOabNumero(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>
              <label className="block">
                <span className="text-slate-600 font-semibold">UF</span>
                <select
                  required={temOab}
                  value={oabUf}
                  onChange={(e) => setOabUf(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {ESTADOS_BR.map((estado) => (
                    <option key={estado.uf} value={estado.uf}>
                      {estado.uf}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <label className="block text-sm">
          <span className="text-slate-600 font-semibold">Senha</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <span className="text-[11px] text-slate-400">Mínimo de 8 caracteres.</span>
        </label>

        <label className="block text-sm">
          <span className="text-slate-600 font-semibold">Confirmar senha</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
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
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Já tem conta?{' '}
          <Link to="/login" className="text-cyan-700 font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
