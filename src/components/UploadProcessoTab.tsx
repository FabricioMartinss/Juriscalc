/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, type ChangeEvent } from 'react';
import { UploadCloud, FileText, ShieldCheck, Loader2, Send, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../contexts/AuthContext';
import { CAMPOS_EMISSAO, DADOS_EMISSAO_VAZIOS, chaveMunicipio, MUNICIPIO_POR_CHAVE, type DadosEmissao } from '../lib/camposEmissao';
import { useExtensaoPresente } from '../lib/extensaoBridge';
import { resolverCamposProcessoNovo } from '../lib/processoNovo';
import { COMARCAS_TJSP } from '../data/comarcasTJSP';
import { CLASSES_TJSP } from '../data/classesTJSP';

const TIPOS_ACEITOS = '.pdf,.jpg,.jpeg,.png';

type Estado = 'ocioso' | 'enviando' | 'revisando' | 'erro';

export default function UploadProcessoTab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const extensaoPresente = useExtensaoPresente();

  const [estado, setEstado] = useState<Estado>('ocioso');
  const [erro, setErro] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');
  const [dados, setDados] = useState<DadosEmissao>(DADOS_EMISSAO_VAZIOS);
  // Só usados por processos que abrem "processo novo" no portal (Petição
  // Inicial, Execução de Título Extrajudicial, Ação Penal Privada - Inicial)
  // — nos demais serviços a extensão simplesmente ignora, sem quebrar nada.
  const [comarca, setComarca] = useState('');
  const [classeProcessual, setClasseProcessual] = useState('');
  const [enviadoParaExtensao, setEnviadoParaExtensao] = useState(false);

  async function aoSelecionarArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite reenviar o mesmo arquivo depois
    if (!arquivo) return;

    setNomeArquivo(arquivo.name);
    setErro(null);
    setEnviadoParaExtensao(false);
    setEstado('enviando');

    try {
      const formData = new FormData();
      formData.append('documento', arquivo);

      const resposta = await fetch(`${API_URL}/api/documentos/extrair`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        throw new Error(corpo?.erro ?? 'Não foi possível extrair os dados do documento.');
      }

      const extraido = corpo.dados as Record<string, string | null>;
      setDados({
        cpf: extraido.cpf ?? '',
        nome: extraido.nome ?? '',
        telefone: extraido.telefone ?? '',
        endereco: extraido.endereco ?? '',
        municipio: extraido.municipio ?? '',
        processo: extraido.processo ?? '',
      });
      setComarca(extraido.comarca ?? '');
      setClasseProcessual(extraido.classeProcessual ?? '');
      setEstado('revisando');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível extrair os dados do documento.');
      setEstado('erro');
    }
  }

  function reiniciar() {
    setEstado('ocioso');
    setErro(null);
    setNomeArquivo('');
    setDados(DADOS_EMISSAO_VAZIOS);
    setComarca('');
    setClasseProcessual('');
    setEnviadoParaExtensao(false);
  }

  function enviarParaExtensao() {
    const dadosResolvidos = {
      ...dados,
      // Mesma resolução do painel: manda o nome oficial do município, nunca
      // o texto lido do documento — é contra ele que o portal casa.
      municipio: MUNICIPIO_POR_CHAVE.get(chaveMunicipio(dados.municipio)) ?? dados.municipio,
    };
    // Comarca/classe processual só valem para quem abrir Petição Inicial,
    // Execução de Título Extrajudicial ou Ação Penal Privada no painel — a
    // extensão ignora sem erro se o serviço escolhido não usar esses campos.
    const extras = resolverCamposProcessoNovo({ comarca, classeProcessual });
    window.postMessage({ type: 'JUDS_DADOS_PROCESSO', dados: dadosResolvidos, extras }, '*');
    setEnviadoParaExtensao(true);
    setTimeout(() => setEnviadoParaExtensao(false), 5000);
  }

  const todosValidos = CAMPOS_EMISSAO.every((c) => c.valido(dados[c.campo]));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5" id="upload-processo-tab-root">
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-cyan-600" />
          Importar Processo
        </h3>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          Envie o PDF ou uma foto do processo. O Claude Vision lê o documento e prepara os dados para o
          painel lateral da extensão preencher sozinho — você confere e emite normalmente.
        </p>
      </div>

      <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-lg text-[11px] text-cyan-900 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
        <span>
          Os dados do documento <strong>não ficam armazenados</strong> em nenhum momento — o arquivo é lido,
          os dados são extraídos e tudo é descartado assim que a resposta chega até você.
        </span>
      </div>

      {estado !== 'revisando' && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={TIPOS_ACEITOS}
            onChange={aoSelecionarArquivo}
            disabled={estado === 'enviando'}
            className="hidden"
            id="upload-processo-input"
          />
          <label
            htmlFor="upload-processo-input"
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 px-4 text-center cursor-pointer transition-colors ${
              estado === 'enviando'
                ? 'border-slate-200 bg-slate-50 cursor-wait'
                : 'border-cyan-300 bg-cyan-50/30 hover:bg-cyan-50/60'
            }`}
          >
            {estado === 'enviando' ? (
              <>
                <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-600">Lendo {nomeArquivo}…</span>
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-cyan-600" />
                <span className="text-xs font-bold text-slate-700">Clique para escolher o arquivo</span>
                <span className="text-[10px] text-slate-400">PDF, JPG ou PNG · até 15MB</span>
              </>
            )}
          </label>
        </div>
      )}

      {estado === 'erro' && erro && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {estado === 'revisando' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-500 font-semibold">
            Confira os dados extraídos de <span className="text-slate-700">{nomeArquivo}</span> antes de enviar:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {CAMPOS_EMISSAO.map((c) => {
              const valor = dados[c.campo];
              const emProgresso =
                !!c.opcoes && valor.length > 0 && c.opcoes.some((o) => chaveMunicipio(o).includes(chaveMunicipio(valor)));
              const invalido = valor.length > 0 && !c.valido(valor) && !emProgresso;
              const classe = `w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 ${
                invalido
                  ? 'border-red-300 bg-red-50 focus:ring-red-300'
                  : 'border-slate-200 focus:ring-cyan-400'
              }`;
              const largura = c.campo === 'nome' || c.campo === 'endereco' ? 'col-span-2' : '';

              if (c.opcoes) {
                const idLista = `upload-lista-${c.campo}`;
                return (
                  <label key={c.campo} className={`block text-[10px] font-semibold text-slate-500 ${largura}`}>
                    {c.label}
                    <input
                      list={idLista}
                      value={valor}
                      onChange={(e) => setDados((d) => ({ ...d, [c.campo]: e.target.value }))}
                      onBlur={() => {
                        const oficial = MUNICIPIO_POR_CHAVE.get(chaveMunicipio(valor));
                        if (oficial && oficial !== valor) setDados((d) => ({ ...d, [c.campo]: oficial }));
                      }}
                      className={`${classe} mt-1`}
                    />
                    <datalist id={idLista}>
                      {c.opcoes.map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </label>
                );
              }

              return (
                <label key={c.campo} className={`block text-[10px] font-semibold text-slate-500 ${largura}`}>
                  {c.label}
                  <input
                    value={valor}
                    inputMode={c.numerico ? 'numeric' : undefined}
                    maxLength={c.maxLength}
                    onChange={(e) => {
                      const novo = c.mask ? c.mask(e.target.value) : e.target.value;
                      setDados((d) => ({ ...d, [c.campo]: novo }));
                    }}
                    className={`${classe} mt-1`}
                  />
                </label>
              );
            })}
          </div>

          <div>
            <p className="text-[10px] text-slate-400 mb-2">
              Só usados se você abrir Petição Inicial, Execução de Título Extrajudicial ou Ação Penal
              Privada no painel — nos demais serviços, ficam sem efeito.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block text-[10px] font-semibold text-slate-500">
                Comarca
                <input
                  list="upload-lista-comarca"
                  value={comarca}
                  onChange={(e) => setComarca(e.target.value)}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs mt-1 border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <datalist id="upload-lista-comarca">
                  {COMARCAS_TJSP.map((c) => (
                    <option key={c.valor} value={c.rotulo} />
                  ))}
                </datalist>
              </label>
              <label className="block text-[10px] font-semibold text-slate-500">
                Classe processual
                <input
                  list="upload-lista-classe"
                  value={classeProcessual}
                  onChange={(e) => setClasseProcessual(e.target.value)}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs mt-1 border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <datalist id="upload-lista-classe">
                  {CLASSES_TJSP.map((c) => (
                    <option key={c.valor} value={c.rotulo} />
                  ))}
                </datalist>
              </label>
            </div>
          </div>

          {!extensaoPresente && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Extensão não detectada. Instale-a na aba "Extensão" para receber estes dados automaticamente.</span>
            </div>
          )}

          {enviadoParaExtensao && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Enviado! Abra o painel lateral da extensão para conferir e emitir a guia.</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={enviarParaExtensao}
              disabled={!todosValidos || !extensaoPresente}
              className="flex-1 py-2.5 px-4 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 bg-[#0b2545] text-white hover:bg-[#0d2d54] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar para a extensão
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="py-2.5 px-3 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              title="Enviar outro documento"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
