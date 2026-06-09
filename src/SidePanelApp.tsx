/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App-shell do painel lateral (Chrome Side Panel):
 *  - barra de marca fina (fixa no topo)
 *  - área rolável só com o seletor e-SAJ/E-PROC + os inputs
 *  - barra de TOTAL fixa no rodapé (fora da rolagem), sempre visível
 */
import { useCallback, useState } from 'react';
import { Scale } from 'lucide-react';
import WizardCalculator from './components/WizardCalculator';
import { UFESP_2026 } from './data/tabelaPratica';

export default function SidePanelApp() {
  const [total, setTotal] = useState(0);

  const handleResult = useCallback((novoTotal: number) => {
    setTotal((atual) => (atual === novoTotal ? atual : novoTotal));
  }, []);

  return (
    <div className="h-screen flex flex-col antialiased text-slate-900 bg-slate-50 overflow-hidden">
      {/* Topo: marca */}
      <header className="shrink-0 bg-[#0b2545] text-white px-4 py-2.5 flex items-center gap-2.5 shadow-md shadow-blue-950/20 z-10">
        <div className="w-8 h-8 bg-cyan-400 rounded-xl flex items-center justify-center text-[#0b2545] shrink-0">
          <Scale className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="font-black uppercase text-sm tracking-tight">
            JurisCalc <span className="text-cyan-400">SP</span>
          </div>
          <div className="text-[10px] font-mono text-blue-200/70">
            UFESP 2026 · R$ {UFESP_2026.toFixed(2)}
          </div>
        </div>
      </header>

      {/* Meio: única área rolável (inputs + seletor de tipo) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <WizardCalculator compact onResult={handleResult} />
      </main>

      {/* Rodapé: total fixo, sempre visível */}
      <div className="shrink-0 bg-[#0b2545] border-t border-white/10 px-4 py-3 shadow-[0_-10px_24px_rgba(2,12,27,0.25)] z-10">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-[10px] font-bold uppercase tracking-widest text-blue-200/70 leading-tight">
            Valor de Guia Recomendado
          </span>
          <span className="shrink-0 text-2xl font-mono font-bold text-white tracking-tight whitespace-nowrap">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
