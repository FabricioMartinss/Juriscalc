/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Scale, Info, HelpCircle, FileText, CheckCircle2, Chrome } from 'lucide-react';
import WizardCalculator from './components/WizardCalculator';
import IndexTableConsultant from './components/IndexTableConsultant';
import CourtCostsReference from './components/CourtCostsReference';
import ChromeExtensionTab from './components/ChromeExtensionTab';
import { UFESP_2026 } from './data/tabelaPratica';

export default function App() {
  const [sidebarTab, setSidebarTab] = useState<'referencias' | 'index-consultant' | 'extensao'>('extensao');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased" id="app-wrapper">
      {/* Top Professional Header - Bento Style Dark Slate */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 py-4 px-6 shadow-md" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-amber-500 rounded flex items-center justify-center font-extrabold text-slate-950 shadow-sm font-sans">
              J
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans font-black text-white text-xl tracking-tight uppercase">
                  JurisCalc <span className="text-amber-500 underline decoration-2">SP</span>
                </h1>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">v1.1</span>
              </div>
              <p className="font-sans text-[11px] text-slate-400">Calculadora e Auditora de Custas do Tribunal de Justiça de São Paulo</p>
            </div>
          </div>

          {/* Quick Legal Reference Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
            <div className="py-1 px-3 bg-slate-800 border border-slate-750 rounded-full flex items-center space-x-1.5">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Exercício 2026</span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono font-bold text-slate-200">UFESP: R$ {UFESP_2026.toFixed(2)}</span>
            </div>
            <div className="hidden md:flex py-1 px-3 bg-slate-800 border border-slate-750 rounded-full items-center space-x-1.5">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Reforma Legal</span>
              <span className="font-semibold text-slate-300">Lei nº 17.785/23</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:p-6" id="app-main">
        {/* Editorial Disclaimer and App Role */}
        <div className="mb-6 p-5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs" id="app-intro">
          <div className="space-y-1">
            <h2 className="font-sans font-bold text-slate-900 text-sm flex items-center">
              <CheckCircle2 className="h-4.5 w-4.5 mr-2 text-amber-600 shrink-0" id="lucide-check-circle-intro" />
              Auditoria de Custas Cíveis e Preparos do JEC / Varas Paulistas
            </h2>
            <p className="font-sans text-xs text-slate-600 leading-relaxed">
              Emissor e revisor tributário de custas processuais que calcula automaticamente limites legais, litisconsórcios voluntários, as duas parcelas do JEC recursal com pisos individuais, e realiza a correção monetária da causa com base na jurisprudência paulista.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center">
            Suporta <span className="text-slate-900 font-extrabold mx-1">e-SAJ</span> e <span className="text-slate-900 font-extrabold">E-PROC</span> TJSP
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="app-grid">
          {/* Main Calculation Panel (takes columns 8) */}
          <div className="xl:col-span-8 flex flex-col" id="grid-left">
            <WizardCalculator />
          </div>

          {/* Side Reference Panel (takes columns 4) */}
          <div className="xl:col-span-4 flex flex-col space-y-6" id="grid-right">
            {/* Tab controls to toggle between index updates and official rates */}
            <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex space-x-1" id="sidebar-tab-control">
              <button
                onClick={() => setSidebarTab('extensao')}
                className={`flex-1 py-2 text-center text-[11px] sm:text-xs font-sans font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  sidebarTab === 'extensao' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="btn-sidebar-ext"
              >
                <Chrome className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Extensão</span>
              </button>
              <button
                onClick={() => setSidebarTab('referencias')}
                className={`flex-1 py-2 text-center text-[11px] sm:text-xs font-sans font-bold rounded-lg transition-all cursor-pointer ${
                  sidebarTab === 'referencias' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="btn-sidebar-ref"
              >
                Tabelas SP
              </button>
              <button
                onClick={() => setSidebarTab('index-consultant')}
                className={`flex-1 py-2 text-center text-[11px] sm:text-xs font-sans font-bold rounded-lg transition-all cursor-pointer ${
                  sidebarTab === 'index-consultant' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="btn-sidebar-index"
              >
                Atualizador
              </button>
            </div>

            {/* Simulated Frame content based on selected tab */}
            <div className="flex-1" id="sidebar-tabs-body">
              {sidebarTab === 'extensao' ? (
                <ChromeExtensionTab />
              ) : sidebarTab === 'referencias' ? (
                <CourtCostsReference />
              ) : (
                <IndexTableConsultant />
              )}
            </div>

            {/* Professional Disclaimer Stamp */}
            <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-xl text-slate-700 space-y-2 text-xs shadow-xs" id="disclaimer-stamp">
              <div className="flex items-center space-x-1.5 font-bold text-amber-905">
                <HelpCircle className="h-4.5 w-4.5 text-amber-600" id="lucide-help-circle-disclaimer" />
                <span>Uso e Validade Legal</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Este software é uma calculadora consultiva que aplica os dispositivos da Lei Estadual nº 11.608/2003 consolidada e da Tabela de Índices do TJSP. Os resultados servem para instrução de cálculo e preenchimento de guias de preparo. Certifique-se de validar guias de depósito final antes do protocolo.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Elegant minimalist Editorial Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800 py-5 px-6" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-200">© 2026 JurisCalc SP. Todos os direitos reservados.</p>
            <p className="text-[10px] text-slate-500">
              Este software e sua respectiva extensão Google Chrome são de propriedade intelectual e comercial exclusiva da <strong className="text-slate-400 font-bold">Camelsec Plataforma</strong> (Plataforma Camelsec Ltda), inscrita no <strong className="text-slate-400 font-bold">CNPJ sob nº 51.811.543/0001-20</strong>.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 font-semibold">
            <a href="https://www.tjsp.jus.br" target="_blank" rel="noreferrer" className="text-slate-405 hover:text-amber-400 transition-colors">TJSP Oficial</a>
            <a href="https://portaldecustas.tjsp.jus.br" target="_blank" rel="noreferrer" className="text-slate-405 hover:text-amber-400 transition-colors">Sefaz/SP Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
