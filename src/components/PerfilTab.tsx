/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  User,
  LifeBuoy,
  Mail,
  Phone,
  Scale as ScaleIcon,
  ChevronDown,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { API_URL, useAuth } from '../contexts/AuthContext';

const TAMANHO_MIN_MENSAGEM = 10;
const TAMANHO_MAX_MENSAGEM = 4000;

type Aba = 'dados' | 'suporte';

// Perguntas frequentes: curtas de propósito, cada uma reflete um comportamento
// real do produto (não é texto genérico de suporte) — ver os componentes
// citados entre parênteses pra quem for revisar/atualizar depois.
const FAQ: { pergunta: string; resposta: string }[] = [
  {
    pergunta: 'A extensão não aparece como detectada no site',
    resposta:
      'Confira se instalou a extensão JuriscalcSP no Chrome e se está numa aba de juriscalcsp.com. Depois de instalar, recarregue a página — a extensão só se anuncia ao carregar.',
  },
  {
    pergunta: 'Enviei um documento e apareceu "este arquivo não parece ser um documento de processo"',
    resposta:
      'O Claude Vision só libera os dados quando reconhece uma peça, decisão, certidão ou guia de verdade. Anotações, prints de tela e rascunhos são recusados de propósito — confira se enviou o arquivo certo.',
  },
  {
    pergunta: 'O botão "Enviar para a extensão" está desabilitado',
    resposta:
      'Confira se CPF, nome, telefone, endereço e município estão preenchidos na tela de revisão. O nº do processo pode ficar vazio só quando o documento é uma Petição Inicial, Execução de Título Extrajudicial ou Ação Penal Privada (processo ainda não existe).',
  },
  {
    pergunta: 'Minha OAB é obrigatória no cadastro?',
    resposta:
      'Não. Número e UF da OAB são opcionais — mas se preencher um dos dois, precisa preencher o outro junto.',
  },
  {
    pergunta: 'É seguro enviar o PDF do meu processo?',
    resposta:
      'Sim. O arquivo é lido, os dados são extraídos e tudo é descartado assim que a resposta chega até você — nenhum conteúdo de documento fica armazenado em servidor nenhum.',
  },
  {
    pergunta: 'Esqueci minha senha, como recupero?',
    resposta:
      'Ainda não existe recuperação automática de senha na plataforma. Entre em contato com o suporte para recriar o acesso.',
  },
  {
    pergunta: 'O foro ou a comarca não vieram preenchidos automaticamente',
    resposta:
      'Só preenche sozinho quando o documento traz o nome reconhecível do foro, ou quando a comarca escolhida tem um único foro no portal. Comarcas grandes (São Paulo, Campinas...) têm vários foros — nesse caso você escolhe na mão.',
  },
  {
    pergunta: 'Troquei de serviço e os campos que eu tinha preenchido sumiram',
    resposta:
      'É esperado: cada serviço do portal pede campos diferentes, então ao trocar de serviço os campos específicos são limpos — evita mandar um dado do serviço anterior para o campo errado do novo.',
  },
  {
    pergunta: 'A guia saiu do portal com um campo em branco que eu não preenchi no painel',
    resposta:
      'Alguns campos (partes do processo, comarca/foro do bloco de processo novo) são deixados de propósito para você completar direto no portal — a extensão nunca clica em "Adicionar" sozinha, então dá pra conferir tudo antes de emitir.',
  },
  {
    pergunta: 'Posso usar minha conta em mais de um computador?',
    resposta:
      'Sim. O login é por sessão (válida por 30 dias) — é só entrar com o mesmo e-mail e senha em qualquer navegador com a extensão instalada.',
  },
];

function LinhaDado({
  icone: Icone,
  label,
  valor,
}: {
  icone: typeof User;
  label: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
        <Icone className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 break-words">{valor}</p>
      </div>
    </div>
  );
}

function ItemFaq({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left bg-white hover:bg-slate-50 cursor-pointer"
      >
        <span className="text-xs font-bold text-slate-700">{pergunta}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
        />
      </button>
      {aberto && (
        <div className="px-3.5 pb-3.5 pt-0.5 text-xs text-slate-600 leading-relaxed bg-white">{resposta}</div>
      )}
    </div>
  );
}

/**
 * Caixa de contato no fim da aba Suporte — manda a mensagem pra
 * server/src/routes/suporte.ts, que encaminha por e-mail pra
 * suporte.juriscalcsp@gmail.com (ou o que estiver em SUPORTE_EMAIL_DESTINO).
 * O usuário nunca vê nem digita o e-mail de destino aqui — é fixo no servidor.
 */
function FormularioContato() {
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const tamanho = mensagem.trim().length;
  const valido = tamanho >= TAMANHO_MIN_MENSAGEM && tamanho <= TAMANHO_MAX_MENSAGEM;

  async function enviar() {
    if (!valido || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch(`${API_URL}/api/suporte`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        throw new Error(corpo?.erro ?? 'Não foi possível enviar sua mensagem. Tente novamente.');
      }
      setMensagem('');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 6000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar sua mensagem. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pt-2 mt-2 border-t border-slate-100">
      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <LifeBuoy className="w-3.5 h-3.5 text-cyan-600" />
        Não achou o que procurava?
      </h4>
      <p className="text-[11px] text-slate-500 mt-1 mb-2.5 leading-relaxed">
        Descreva a dúvida ou o problema — a mensagem vai direto para o nosso suporte, junto com seu nome e e-mail
        de cadastro para a resposta.
      </p>

      <textarea
        value={mensagem}
        onChange={(e) => {
          setMensagem(e.target.value.slice(0, TAMANHO_MAX_MENSAGEM));
          setErro(null);
        }}
        disabled={enviando}
        rows={4}
        maxLength={TAMANHO_MAX_MENSAGEM}
        placeholder="Ex.: a extensão não preencheu o campo de comarca mesmo com o documento certo..."
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-60 resize-y"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-slate-400">
          {tamanho}/{TAMANHO_MAX_MENSAGEM}
        </span>
        {tamanho > 0 && tamanho < TAMANHO_MIN_MENSAGEM && (
          <span className="text-[10px] text-amber-600">Mais alguns caracteres pra mandar</span>
        )}
      </div>

      {erro && (
        <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {enviado && (
        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Mensagem enviada! A resposta vai para o seu e-mail de cadastro.</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => void enviar()}
        disabled={!valido || enviando}
        className="mt-2.5 w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 bg-[#0b2545] text-white hover:bg-[#0d2d54] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {enviando ? 'Enviando…' : 'Enviar para o suporte'}
      </button>
    </div>
  );
}

export default function PerfilTab() {
  const { usuario } = useAuth();
  const [aba, setAba] = useState<Aba>('dados');

  if (!usuario) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5" id="perfil-tab-root">
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-600" />
          Meu Perfil
        </h3>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          Seus dados de cadastro e respostas rápidas para as dúvidas mais comuns.
        </p>
      </div>

      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit" role="tablist" aria-label="Seções do perfil">
        {(
          [
            { id: 'dados', label: 'Meus Dados', icon: User },
            { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const ativo = aba === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setAba(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                ativo ? 'bg-white text-[#0b2545] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {aba === 'dados' && (
        <div>
          <LinhaDado icone={User} label="Nome" valor={usuario.nome} />
          <LinhaDado icone={Mail} label="E-mail" valor={usuario.email} />
          <LinhaDado icone={Phone} label="Telefone" valor={usuario.telefone} />
          <LinhaDado
            icone={ScaleIcon}
            label="OAB"
            valor={usuario.oabNumero && usuario.oabUf ? `${usuario.oabNumero}/${usuario.oabUf}` : 'Não informada'}
          />

          <div className="mt-4 p-3 bg-cyan-50/60 border border-cyan-200 rounded-lg text-[11px] text-cyan-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <span>
              Esses dados identificam sua conta e servem só para login — nenhum processo ou documento fica
              associado ao seu cadastro.
            </span>
          </div>
        </div>
      )}

      {aba === 'suporte' && (
        <div>
          <div className="space-y-2">
            {FAQ.map((item) => (
              <ItemFaq key={item.pergunta} {...item} />
            ))}
          </div>
          <FormularioContato />
        </div>
      )}
    </div>
  );
}
