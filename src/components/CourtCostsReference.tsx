/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BookOpen, Scale, Award, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { CATEGORIAS_METADATA, UFESP_2026, CUTOFF_DATE } from '../data/tabelaPratica';

export default function CourtCostsReference() {
  const [selectedTab, setSelectedTab] = useState<'geral' | 'regras' | 'municipios'>('geral');
  const [selectedMeta, setSelectedMeta] = useState<string>('iniciais');

  const metaItem = CATEGORIAS_METADATA.find(c => c.id === selectedMeta) || CATEGORIAS_METADATA[0];

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-xs flex flex-col h-full" id="court-costs-reference">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-[#F9F9F9] rounded-lg border border-[#E5E5E5]">
          <BookOpen className="h-5 w-5 text-neutral-700" id="lucide-book-open" />
        </div>
        <div>
          <h3 className="font-sans font-semibold text-neutral-900 tracking-tight text-base">Guia e Base Legal das Custas</h3>
          <p className="font-sans text-xs text-neutral-500">Parâmetros normativos da Lei Paulista nº 11.608/2003</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E5E5] mb-4">
        <button
          onClick={() => setSelectedTab('geral')}
          className={`pb-2 px-3 text-xs font-sans font-medium transition-colors border-b-2 -mb-[2px] cursor-pointer ${
            selectedTab === 'geral' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          id="tab-ref-geral"
        >
          Premissas Gerais
        </button>
        <button
          onClick={() => setSelectedTab('regras')}
          className={`pb-2 px-3 text-xs font-sans font-medium transition-colors border-b-2 -mb-[2px] cursor-pointer ${
            selectedTab === 'regras' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          id="tab-ref-regras"
        >
          Pesquisa por Classe
        </button>
        <button
          onClick={() => setSelectedTab('municipios')}
          className={`pb-2 px-3 text-xs font-sans font-medium transition-colors border-b-2 -mb-[2px] cursor-pointer ${
            selectedTab === 'municipios' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          id="tab-ref-municipios"
        >
          Instruções de Guias
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto text-sm text-neutral-700 space-y-4 pr-1">
        {selectedTab === 'geral' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-150 space-y-2">
              <h4 className="font-sans font-semibold text-neutral-900 text-xs flex items-center">
                <Scale className="h-4 w-4 mr-1.5 text-neutral-700" id="lucide-scale" />
                Lei nº 11.608/2003 (Taxa Judiciária de SP)
              </h4>
              <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                Regula o fato gerador das custas judiciais no Tribunal de Justiça de São Paulo. A lei sofreu uma reforma crítica por meio da **Lei Estadual nº 17.785/2023**, que entrou em pleno vigor no dia **03/01/2024** (data de corte no sistema), unificando e aumentando taxas judiciais para racionalizar a prestação jurisprudencial.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border border-neutral-200 rounded-lg">
                <span className="block text-neutral-400 text-[10px] font-mono uppercase tracking-wider">UFESP 2026</span>
                <span className="font-mono text-base font-bold text-neutral-900">R$ {UFESP_2026.toFixed(2)}</span>
                <span className="block text-[10px] text-neutral-500 font-sans mt-0.5">Unidade Fiscal do Estado de São Paulo</span>
              </div>
              <div className="p-3 border border-neutral-200 rounded-lg">
                <span className="block text-neutral-400 text-[10px] font-mono uppercase tracking-wider">Piso / Teto Geral</span>
                <span className="font-mono text-base font-bold text-neutral-900">5 a 3.000 UFESPs</span>
                <span className="block text-[10px] text-neutral-500 font-sans mt-0.5">R$ 192,10 a R$ 115.260,00</span>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 border border-neutral-150 rounded-lg space-y-1.5 text-xs text-neutral-600">
              <span className="font-sans font-semibold text-neutral-900 block">Isenções de Custas prévias:</span>
              <ul className="list-disc list-inside space-y-1">
                <li>Fazenda Pública e Ministério Público (Art. 1007, § 1 CPC)</li>
                <li>Pessoas com gratuidade judiciária concedida (Art. 98 CPC)</li>
                <li>Processo do 1º Grau dos Juizados Especiais Cíveis (JEC) (Art. 54 Lei 9099)</li>
              </ul>
            </div>
          </div>
        )}

        {selectedTab === 'regras' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-sans">
                Selecione uma categoria legal de São Paulo:
              </label>
              <select
                value={selectedMeta}
                onChange={(e) => setSelectedMeta(e.target.value)}
                className="block w-full px-2.5 py-1.5 border border-[#CCCCCC] bg-white rounded-md text-xs font-sans text-neutral-800 focus:outline-hidden focus:border-neutral-900"
                id="select-ref-meta"
              >
                {CATEGORIAS_METADATA.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-neutral-50 border border-[#E5E5E5] rounded-lg space-y-3">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">CLASSE / ATO</span>
                <span className="font-sans font-semibold text-neutral-900 text-sm">{metaItem.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">FUNDAMENTAÇÃO LEGAL</span>
                <span className="font-sans text-xs text-neutral-800">{metaItem.baseLegal}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">GUIA / PORTAL DE DESTINO</span>
                <span className="font-sans text-xs font-medium text-neutral-900">{metaItem.source} (Código receptor: {metaItem.defaultCode})</span>
              </div>
              <div className="border-t border-neutral-200 pt-3">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">FÓRMULA E EXPLICAÇÃO</span>
                <p className="font-sans text-xs text-neutral-600 leading-relaxed mt-1">
                  {metaItem.legalExplanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'municipios' && (
          <div className="space-y-4 text-xs font-sans text-neutral-600">
            <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-lg space-y-2">
              <span className="font-sans font-semibold text-neutral-900 block flex items-center">
                <ShieldAlert className="h-4 w-4 mr-1 text-neutral-700" id="lucide-shield-alert" />
                Guia DARE-SP (Código 230-6)
              </span>
              <p className="leading-relaxed">
                A **Taxa Judiciária** devida ao TJSP deve ser recolhida exclusivamente pelo Documento de Arrecadação de Receitas Estaduais (**Guia DARE-SP**), gerada no Portal de Custas da Secretaria da Fazenda de SP. Informe cuidadosamente a natureza e o número correto do processo.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-lg space-y-2">
              <span className="font-sans font-semibold text-neutral-900 block flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-neutral-700" id="lucide-check-circle" />
                Guia FEDTJ (Código 120-1)
              </span>
              <p className="leading-relaxed">
                As **Despesas Processuais** administrativas (como envio de intimações por AR de correio, publicações de editais cíveis e termos informatizados) devem ser pagas por meio do Fundo Especial de Despesa do Tribunal de Justiça (**Guia FEDTJ**), gerada no portal de emissão do Banco do Brasil.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-lg space-y-2">
              <span className="font-sans font-semibold text-neutral-900 block flex items-center">
                <Info className="h-4 w-4 mr-1 text-neutral-700" id="lucide-info" />
                Diligências por Guia GRD
              </span>
              <p className="leading-relaxed">
                As **Diligências de Oficiais de Justiça** são destinadas ao pagamento de locomoção e atos de notificação pessoal. Devem ser pagas via depósito em conta vinculada na Caixa Econômica / Banco do Brasil por meio de guias GRD (Guia de Recolhimento de Diligência) emitidas no portal específico do Oficial de Justiça.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
