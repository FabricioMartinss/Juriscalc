/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, type ChangeEvent } from 'react';
import { UploadCloud, FileText, ShieldCheck, Loader2, Send, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../contexts/AuthContext';
import {
  CAMPOS_EMISSAO,
  DADOS_EMISSAO_VAZIOS,
  chaveMunicipio,
  chaveTexto,
  mascaraCpfCnpj,
  MUNICIPIO_POR_CHAVE,
  type DadosEmissao,
} from '../lib/camposEmissao';
import { useExtensaoPresente } from '../lib/extensaoBridge';
import { canonizarComarca, resolverCamposProcessoNovo } from '../lib/processoNovo';
import { COMARCAS_TJSP } from '../data/comarcasTJSP';
import { CLASSES_TJSP } from '../data/classesTJSP';
import { FOROS_TJSP } from '../data/forosTJSP';
import { FOROS_POR_COMARCA } from '../data/forosPorComarca';

const TIPOS_ACEITOS = '.pdf,.jpg,.jpeg,.png';

type Estado = 'ocioso' | 'enviando' | 'revisando' | 'erro';
type Instancia = 'primeira' | 'segunda';
type Participacao = '' | 'autor' | 'reu';

// Espelha o retorno de server/src/lib/extrairDocumento.ts (DadosProcessoExtraidos).
interface DadosExtraidos {
  pareceProcessoJudicial: boolean;
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  endereco: string | null;
  municipio: string | null;
  processo: string | null;
  comarca: string | null;
  classeProcessual: string | null;
  foro: string | null;
  instancia: Instancia | null;
  participacaoParte: 'autor' | 'reu' | null;
  comarcaOrigem: string | null;
  valorCausa: string | null;
}

const campoCls =
  'w-full border rounded-lg px-2.5 py-1.5 text-xs mt-1 border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400';

const COMARCA_VALOR_POR_CHAVE = new Map(COMARCAS_TJSP.map((c) => [chaveTexto(c.rotulo), c.valor]));
const FORO_ROTULO_POR_VALOR = new Map(FOROS_TJSP.map((f) => [f.valor, f.rotulo]));

/** Rótulos de foro da comarca digitada — só eles carregam no portal. Comarca não resolvida → lista completa. */
function forosDaComarca(comarcaTexto: string): string[] {
  const valor = COMARCA_VALOR_POR_CHAVE.get(chaveTexto(comarcaTexto));
  const ids = valor ? FOROS_POR_COMARCA[valor] : undefined;
  if (!ids) return FOROS_TJSP.map((f) => f.rotulo);
  return ids.map((id) => FORO_ROTULO_POR_VALOR.get(id) ?? '').filter(Boolean);
}

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
  const [foro, setForo] = useState('');
  const [instancia, setInstancia] = useState<Instancia>('primeira');
  const [participacao, setParticipacao] = useState<Participacao>('');
  const [parteNome, setParteNome] = useState('');
  const [parteCpf, setParteCpf] = useState('');
  // Só carta precatória/de ordem de outro tribunal — só aparece se a extração
  // detectar o caso.
  const [comarcaOrigem, setComarcaOrigem] = useState('');
  // Lido do documento só para conferência — não vai para a guia (o valor da
  // guia vem da calculadora).
  const [valorCausaDoc, setValorCausaDoc] = useState('');
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

      const extraido = corpo.dados as DadosExtraidos;
      // Porteiro do servidor (ver extrairDocumento.ts): arquivo que não é de
      // processo judicial vem com tudo null. Não abre a revisão em branco —
      // diz o que aconteceu, que é quase sempre arquivo trocado.
      if (extraido.pareceProcessoJudicial === false) {
        setErro(
          'Este arquivo não parece ser um documento de processo (petição, decisão, guia). Confira se enviou o arquivo certo.',
        );
        setEstado('erro');
        return;
      }
      setDados({
        cpf: extraido.cpf ?? '',
        nome: extraido.nome ?? '',
        telefone: extraido.telefone ?? '',
        endereco: extraido.endereco ?? '',
        municipio: extraido.municipio ?? '',
        processo: extraido.processo ?? '',
      });
      setComarca(extraido.comarca ? canonizarComarca(extraido.comarca) : '');
      setClasseProcessual(extraido.classeProcessual ?? '');
      setForo(extraido.foro ?? '');
      setInstancia(extraido.instancia ?? 'primeira');
      setParticipacao(extraido.participacaoParte ?? '');
      // A parte do processo costuma ser a mesma pessoa dos dados de emissão —
      // já vem preenchida a partir do que foi extraído, editável.
      setParteNome(extraido.nome ?? '');
      setParteCpf(extraido.cpf ? mascaraCpfCnpj(extraido.cpf) : '');
      setComarcaOrigem(extraido.comarcaOrigem ?? '');
      setValorCausaDoc(extraido.valorCausa ?? '');
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
    setForo('');
    setInstancia('primeira');
    setParticipacao('');
    setParteNome('');
    setParteCpf('');
    setComarcaOrigem('');
    setValorCausaDoc('');
    setEnviadoParaExtensao(false);
  }

  function enviarParaExtensao() {
    const dadosResolvidos = {
      ...dados,
      // Mesma resolução do painel: manda o nome oficial do município, nunca
      // o texto lido do documento — é contra ele que o portal casa.
      municipio: MUNICIPIO_POR_CHAVE.get(chaveMunicipio(dados.municipio)) ?? dados.municipio,
    };
    // O bloco de processo novo (comarca, foro, classe, instância, partes) só
    // vale para quem abrir Petição Inicial, Execução de Título Extrajudicial ou
    // Ação Penal Privada no painel; comarcaOrigem, para as cartas. A extensão
    // ignora sem erro os ids que o serviço escolhido não usa.
    //
    // `valorCausaDoc` fica de fora de propósito — é só conferência; o valor da
    // guia vem da calculadora.
    const extras = resolverCamposProcessoNovo({
      comarca,
      classeProcessual,
      foro,
      instancia,
      participacaoParte: participacao || null,
      parteNome,
      parteCpf,
      comarcaOrigem,
    });
    window.postMessage({ type: 'JUDS_DADOS_PROCESSO', dados: dadosResolvidos, extras }, '*');
    setEnviadoParaExtensao(true);
    setTimeout(() => setEnviadoParaExtensao(false), 5000);
  }

  // Nº do processo é obrigatório na emissão normal, mas os três serviços de
  // "processo novo" (Petição Inicial, Execução de Título Extrajudicial, Ação
  // Penal Privada) começam um processo — não existe número ainda. Campo vazio
  // aqui é válido; meio preenchido (1–19 dígitos) continua barrando.
  const todosValidos = CAMPOS_EMISSAO.every((c) =>
    c.campo === 'processo' && dados.processo === '' ? true : c.valido(dados[c.campo]),
  );

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
                  className={campoCls}
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
                  className={campoCls}
                />
                <datalist id="upload-lista-classe">
                  {CLASSES_TJSP.map((c) => (
                    <option key={c.valor} value={c.rotulo} />
                  ))}
                </datalist>
              </label>
              <label className="block text-[10px] font-semibold text-slate-500 col-span-2">
                Foro
                <input
                  list="upload-lista-foro"
                  value={foro}
                  onChange={(e) => setForo(e.target.value)}
                  placeholder={comarca ? 'Foro da comarca acima' : 'Preencha a comarca primeiro'}
                  className={campoCls}
                />
                <datalist id="upload-lista-foro">
                  {forosDaComarca(comarca).map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </label>
              <label className="block text-[10px] font-semibold text-slate-500">
                Instância
                <select
                  value={instancia}
                  onChange={(e) => setInstancia(e.target.value as Instancia)}
                  className={campoCls}
                >
                  <option value="primeira">Primeira Instância</option>
                  <option value="segunda">Segunda Instância</option>
                </select>
              </label>
              <label className="block text-[10px] font-semibold text-slate-500">
                Participação da parte
                <select
                  value={participacao}
                  onChange={(e) => setParticipacao(e.target.value as Participacao)}
                  className={campoCls}
                >
                  <option value="">—</option>
                  <option value="autor">Autor</option>
                  <option value="reu">Réu</option>
                </select>
              </label>
              <label className="block text-[10px] font-semibold text-slate-500 col-span-2">
                Nome da parte
                <input
                  value={parteNome}
                  onChange={(e) => setParteNome(e.target.value)}
                  className={campoCls}
                />
              </label>
              <label className="block text-[10px] font-semibold text-slate-500">
                CPF/CNPJ da parte
                <input
                  value={parteCpf}
                  inputMode="numeric"
                  maxLength={18}
                  onChange={(e) => setParteCpf(mascaraCpfCnpj(e.target.value))}
                  className={campoCls}
                />
              </label>
              {comarcaOrigem && (
                <label className="block text-[10px] font-semibold text-slate-500">
                  Comarca de origem (carta)
                  <input
                    value={comarcaOrigem}
                    onChange={(e) => setComarcaOrigem(e.target.value)}
                    className={campoCls}
                  />
                </label>
              )}
            </div>

            {valorCausaDoc && (
              <p className="text-[10px] text-slate-500 mt-2 flex items-start gap-1.5">
                <FileText className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                <span>
                  Valor da causa no documento: <strong className="text-slate-700">R$ {valorCausaDoc}</strong>. Só
                  para conferência — o valor da guia sai da calculadora.
                </span>
              </p>
            )}
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
