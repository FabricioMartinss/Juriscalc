/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import FormularioLogin from '../components/FormularioLogin';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { de?: string } | null)?.de ?? '/app';

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

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg shadow-blue-950/5 border border-slate-100 p-6 space-y-4">
        <h1 className="font-sans font-bold text-lg text-[#0b2545]">Entrar</h1>

        <FormularioLogin
          aoEntrar={() => navigate(destino, { replace: true })}
          rodape={
            <p className="text-xs text-slate-500 text-center">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-cyan-700 font-semibold hover:underline">
                Cadastre-se
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
}
