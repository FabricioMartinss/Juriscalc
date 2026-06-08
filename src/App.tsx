/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Scale, HelpCircle, CheckCircle2, Chrome, Calculator, BookMarked, RefreshCw } from 'lucide-react';
import WizardCalculator from './components/WizardCalculator';
import IndexTableConsultant from './components/IndexTableConsultant';
import CourtCostsReference from './components/CourtCostsReference';
import ChromeExtensionTab from './components/ChromeExtensionTab';
import { UFESP_2026 } from './data/tabelaPratica';

type Section = 'calculadora' | 'extensao' | 'referencias' | 'atualizador';

const NAV_ITEMS: { id: Section; label: string; icon: typeof Calculator; hint: string }[] = [
  { id: 'calculadora', label: 'Calculadora', icon: Calculator, hint: 'Auditoria de custas e preparos' },
  { id: 'extensao', label: 'Extensão', icon: Chrome, hint: 'Extensão para o Chrome' },
  { id: 'referencias', label: 'Tabelas SP', icon: BookMarked, hint: 'Tabelas oficiais do TJSP' },
  { id: 'atualizador', label: 'Atualizador', icon: RefreshCw, hint: 'Correção monetária' },
];

export default function App() {
  const [section, setSection] = useState<Section>('calculadora');

  return (
    <div
      className="min-h-screen flex flex-col antialiased text-slate-900 overflow-x-hidden bg-gradient-to-b from-cyan-50/40 via-slate-50 to-blue-50/40"
      id="app-wrapper"
    >
      {/* ===== Top Brand Header (cool bichromatic) ===== */}
      <header className="bg-[#0b2545] text-white sticky top-0 z-50 shadow-lg shadow-blue-950/20" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 px-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-400 rounded-2xl flex items-center justify-center font-black text-[#0b2545] shadow-md shadow-cyan-500/30 font-sans">
              <Scale className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans font-black text-white tracking-tight uppercase text-xl">
                  JurisCalc <span className="text-cyan-400">SP</span>
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-200 border border-cyan-400/30">
                  v2.0
                </span>
              </div>
              <p className="font-sans text-xs text-blue-200/80">
                Calculadora e Auditora de Custas do Tribunal de Justiça de São Paulo
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="py-1.5 px-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-2">
              <span className="text-[10px] font-mono text-blue-200/70 uppercase tracking-wider">Exercício 2026</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono font-bold text-cyan-100 text-xs">UFESP: R$ {UFESP_2026.toFixed(2)}</span>
            </div>
            <div className="hidden md:flex py-1.5 px-3.5 bg-white/5 border border-white/10 rounded-2xl items-center space-x-2">
              <span className="text-[10px] font-mono text-blue-200/70 uppercase tracking-wider">Reforma</span>
              <span className="font-semibold text-blue-100 text-xs">Lei nº 17.785/23</span>
            </div>
          </div>
        </div>

        {/* ===== Top Navigation Bar (replaces the old sidebar) ===== */}
        <nav className="bg-[#0b2545] border-t border-white/10" id="app-topnav" role="tablist">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSection(item.id)}
                  className={`group relative flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-bold font-sans whitespace-nowrap cursor-pointer rounded-t-2xl ${
                    active ? 'text-white' : 'text-blue-200/60 hover:text-cyan-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-400' : 'text-blue-300/50 group-hover:text-cyan-300'}`} />
                  <span>{item.label}</span>
                  {/* Animated active indicator (smooth slide, not a hard hyperlink) */}
                  <span
                    className={`absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-cyan-400 origin-center ${
                      active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                    }`}
                    style={{ transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 320ms' }}
                  />
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ===== Main Workspace ===== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:p-8" id="app-main">
        {/* Editorial intro */}
        <div
          className="mb-7 p-5 bg-white/80 backdrop-blur border border-cyan-100 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm shadow-cyan-900/5"
          id="app-intro"
        >
          <div className="space-y-1">
            <h2 className="font-sans font-bold text-slate-900 text-sm flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-cyan-700 shrink-0" />
              Auditoria de Custas Cíveis e Preparos do JEC / Varas Paulistas
            </h2>
            <p className="font-sans text-xs text-slate-600 leading-relaxed max-w-3xl">
              Emissor e revisor tributário de custas processuais que calcula automaticamente limites legais,
              litisconsórcios voluntários, as duas parcelas do JEC recursal com pisos individuais, e realiza a
              correção monetária da causa com base na jurisprudência paulista.
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-900 bg-cyan-50 py-2 px-4 rounded-2xl border border-cyan-100 whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center">
            Suporta <span className="text-blue-950 font-extrabold mx-1">e-SAJ</span> e{' '}
            <span className="text-blue-950 font-extrabold ml-1">E-PROC</span>
          </div>
        </div>

        {/* Animated section content (smooth transition between sections) */}
        <div key={section} className="animate-fadeSlideUp">
          {section === 'calculadora' && <WizardCalculator />}
          {section === 'extensao' && (
            <div className="max-w-2xl mx-auto">
              <ChromeExtensionTab />
            </div>
          )}
          {section === 'referencias' && <CourtCostsReference />}
          {section === 'atualizador' && (
            <div className="max-w-2xl mx-auto">
              <IndexTableConsultant />
            </div>
          )}
        </div>

        {/* Professional disclaimer */}
        <div
          className="mt-7 p-5 bg-cyan-50/40 border border-cyan-100 rounded-3xl text-slate-700 space-y-2 text-xs shadow-sm shadow-cyan-900/5"
          id="disclaimer-stamp"
        >
          <div className="flex items-center space-x-2 font-bold text-blue-900">
            <HelpCircle className="h-5 w-5 text-cyan-700" />
            <span>Uso e Validade Legal</span>
          </div>
          <p className="leading-relaxed text-slate-600 max-w-4xl">
            Este software é uma calculadora consultiva que aplica os dispositivos da Lei Estadual nº 11.608/2003
            consolidada e da Tabela de Índices do TJSP. Os resultados servem para instrução de cálculo e
            preenchimento de guias de preparo. Certifique-se de validar guias de depósito final antes do protocolo.
          </p>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="mt-auto bg-[#0b2545] text-blue-200/70 py-6 px-6" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-xs">
          <div className="space-y-1">
            <p className="font-bold text-blue-50">© 2026 JurisCalc SP. Todos os direitos reservados.</p>
            <p className="text-[11px] text-blue-300/50">
              Este software e sua respectiva extensão Google Chrome são de propriedade intelectual e comercial
              exclusiva da <strong className="text-blue-200 font-bold">Camelsec Plataforma</strong> (Plataforma
              Camelsec Ltda), inscrita no <strong className="text-blue-200 font-bold">CNPJ sob nº 51.811.543/0001-20</strong>.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 font-semibold">
            <a href="https://www.tjsp.jus.br" target="_blank" rel="noreferrer" className="text-blue-200/70 hover:text-cyan-400">
              TJSP Oficial
            </a>
            <a href="https://portaldecustas.tjsp.jus.br" target="_blank" rel="noreferrer" className="text-blue-200/70 hover:text-cyan-400">
              Sefaz/SP Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
