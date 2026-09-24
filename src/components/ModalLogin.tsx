/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import { Scale, Lock } from 'lucide-react';
import FormularioLogin from './FormularioLogin';
import { VISITAS_LIVRES } from '../lib/acessoLivre';

/**
 * Cobre a plataforma quando as visitas livres acabam (ver lib/acessoLivre.ts).
 *
 * Não tem botão de fechar de propósito: a partir daqui o uso é com conta. O
 * caminho de saída é voltar para a página inicial, pelo link no rodapé — não
 * prender quem só queria olhar.
 */
export default function ModalLogin({ aoEntrar }: { aoEntrar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#0b2545]/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-login-titulo"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-blue-950/30 border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-cyan-400 rounded-xl flex items-center justify-center text-[#0b2545] shrink-0">
            <Scale className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-sans font-black text-[#0b2545] tracking-tight uppercase">
            Juriscalc<span className="text-cyan-600">SP</span>
          </span>
        </div>

        <div>
          <h2 id="modal-login-titulo" className="font-sans font-bold text-lg text-[#0b2545] flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-600" />
            Entre para continuar
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Você já usou a calculadora {VISITAS_LIVRES} vezes sem conta. Crie a sua — é grátis — e siga usando
            sem limite.
          </p>
        </div>

        <FormularioLogin
          aoEntrar={aoEntrar}
          autoFoco
          rodape={
            <div className="space-y-2 pt-1">
              <p className="text-xs text-slate-500 text-center">
                Não tem conta?{' '}
                <Link to="/cadastro" className="text-cyan-700 font-semibold hover:underline">
                  Cadastre-se
                </Link>
              </p>
              <p className="text-[11px] text-slate-400 text-center">
                <Link to="/" className="hover:underline">
                  Voltar para a página inicial
                </Link>
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
