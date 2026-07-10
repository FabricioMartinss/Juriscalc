import { Chrome, ShieldCheck, ArrowRight, ExternalLink, Clock } from 'lucide-react';

/**
 * Link da extensão na Chrome Web Store.
 *
 * >>> APÓS A APROVAÇÃO DO GOOGLE, cole aqui a URL da loja <<<
 * (algo como "https://chromewebstore.google.com/detail/<id-da-extensao>").
 * Assim que esta constante tiver um valor, o botão passa a instalar em 1 clique
 * automaticamente — não precisa mexer em mais nada.
 */
const CHROME_STORE_URL = '';

export default function ChromeExtensionTab() {
  const published = CHROME_STORE_URL.trim().length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5" id="chrome-ext-tab-root">
      {/* Extension Headline Card */}
      <div className="bg-slate-900 text-white rounded-lg p-4 relative overflow-hidden text-xs space-y-3 shadow-md">
        <div className="absolute top-0 right-0 p-3 opacity-20">
          <Chrome className="w-12 h-12 text-cyan-400 animate-spin-slow" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded text-[9px] tracking-wide uppercase">Oficial</span>
          <span className="text-slate-300 font-mono font-semibold">Extensão v2.0.0</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase">Extensão JudsCalc SP</h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Calcule e audite custas do TJSP (e-SAJ e E-PROC) direto no painel lateral do Chrome.
          </p>
        </div>

        {published ? (
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer bg-cyan-500 text-slate-950 hover:bg-cyan-600"
            id="btn-store-install"
          >
            <Chrome className="h-4 w-4" />
            <span>Adicionar ao Chrome</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <div
            className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase flex items-center justify-center space-x-2 bg-slate-700 text-slate-300 cursor-not-allowed"
            id="btn-store-install"
            aria-disabled="true"
            title="A extensão está em análise pela Chrome Web Store."
          >
            <Clock className="h-4 w-4" />
            <span>Em análise — disponível em breve</span>
          </div>
        )}
      </div>

      {/* Corporate Owner & CNPJ Stamp */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-2 text-[11px] shadow-2xs">
        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Propriedade Comercial</span>
        </div>
        <p className="leading-relaxed text-slate-600 font-medium">
          O JudsCalc SP é de propriedade integral e exclusiva da{' '}
          <strong className="text-slate-900 font-extrabold">Camelsec Plataforma</strong>, regulamentada sob o{' '}
          <span className="font-mono bg-slate-200/75 px-1 rounded text-slate-800 font-bold">CNPJ: 51.811.543/0001-20</span>.
        </p>
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>Licença Segura</span>
          <span>Suporte Camelsec ativo</span>
        </div>
      </div>

      {/* Steps of installation (fluxo real da Chrome Web Store) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Como instalar</h4>
        <div className="space-y-3 text-[11px]">
          <div className="flex gap-2.5 items-start">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-[10px] shrink-0">1</span>
            <p className="text-slate-600 pt-0.5 font-medium">
              Clique em <strong className="text-slate-800">"Adicionar ao Chrome"</strong> acima.
            </p>
          </div>
          <div className="flex gap-2.5 items-start">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-[10px] shrink-0">2</span>
            <p className="text-slate-600 pt-0.5 font-medium">
              Confirme na janela do Chrome clicando em <strong className="text-slate-800">"Adicionar extensão"</strong>.
            </p>
          </div>
          <div className="flex gap-2.5 items-start">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-[10px] shrink-0">3</span>
            <p className="text-slate-600 pt-0.5 font-medium">
              Clique no <strong className="text-slate-800">ícone da balança</strong> na barra do Chrome para abrir o painel lateral.
            </p>
          </div>
        </div>
      </div>

      {/* Auto Integration Features Highlights */}
      <div className="p-3.5 bg-cyan-50/65 border border-cyan-200 rounded-lg space-y-2">
        <h4 className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider flex items-center">
          <Chrome className="w-4 h-4 mr-1.5 text-cyan-700" />
          Recursos da Extensão
        </h4>
        <ul className="space-y-1.5 text-[11.5px] text-slate-600 font-medium">
          <li className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-1.5 text-cyan-700" />
            <span>Calcula custas e preparos do e-SAJ e do E-PROC.</span>
          </li>
          <li className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-1.5 text-cyan-700" />
            <span>Correção monetária pelas tabelas oficiais do TJSP.</span>
          </li>
          <li className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-1.5 text-cyan-700" />
            <span>Valor pronto por guia (DARE, FEDTJ e GRD) para recolhimento.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
