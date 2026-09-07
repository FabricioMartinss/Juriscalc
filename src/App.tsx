/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Scale, HelpCircle, Chrome, Calculator, BookMarked, RefreshCw, LogOut, UploadCloud } from 'lucide-react';
import WizardCalculator from './components/WizardCalculator';
import IndexTableConsultant from './components/IndexTableConsultant';
import CourtCostsReference from './components/CourtCostsReference';
import ChromeExtensionTab from './components/ChromeExtensionTab';
import UploadProcessoTab from './components/UploadProcessoTab';
import { UFESP_2026 } from './data/tabelaPratica';
import { useAuth } from './contexts/AuthContext';

type Section = 'calculadora' | 'importar' | 'extensao' | 'referencias' | 'atualizador';

const NAV_ITEMS: { id: Section; label: string; icon: typeof Calculator; hint: string }[] = [
  { id: 'calculadora', label: 'Calculadora', icon: Calculator, hint: 'Auditoria de custas e preparos' },
  { id: 'importar', label: 'Importar Processo', icon: UploadCloud, hint: 'Extrai dados de um PDF/imagem' },
  { id: 'extensao', label: 'Extensão', icon: Chrome, hint: 'Extensão para o Chrome' },
  { id: 'referencias', label: 'Tabelas SP', icon: BookMarked, hint: 'Tabelas oficiais do TJSP' },
  { id: 'atualizador', label: 'Atualizador', icon: RefreshCw, hint: 'Correção monetária' },
];

export default function App() {
  const [section, setSection] = useState<Section>('calculadora');
  const { usuario, sair } = useAuth();

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
                  Juriscalc<span className="text-cyan-400">SP</span>
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-200 border border-cyan-400/30">
                  v2.0
                </span>
              </div>
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
            {usuario && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs font-semibold text-blue-100 font-sans">
                  {usuario.nome.split(' ')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => void sair()}
                  title="Sair da conta"
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-blue-200/70 hover:text-cyan-200 hover:border-cyan-400/30 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== Top Navigation Bar (replaces the old sidebar) ===== */}
        <nav className="bg-[#0b2545] border-t border-white/10" id="app-topnav" role="tablist" aria-label="Seções do aplicativo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="section-panel"
                  onClick={() => setSection(item.id)}
                  className={`group relative flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-bold font-sans whitespace-nowrap cursor-pointer rounded-t-2xl ${
                    active ? 'text-white' : 'text-blue-200/60 hover:text-cyan-200'
                  }`}
                >
                  <Icon aria-hidden="true" className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-400' : 'text-blue-300/50 group-hover:text-cyan-300'}`} />
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
        {/* Animated section content (smooth transition between sections) */}
        <div key={section} id="section-panel" className="animate-fadeSlideUp" role="tabpanel" aria-label={NAV_ITEMS.find((i) => i.id === section)?.label}>
          {section === 'calculadora' && <WizardCalculator />}
          {section === 'importar' && (
            <div className="max-w-2xl mx-auto">
              <UploadProcessoTab />
            </div>
          )}
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
            <p className="font-bold text-blue-50">© 2026 JuriscalcSP. Todos os direitos reservados.</p>
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
