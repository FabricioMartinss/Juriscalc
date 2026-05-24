import { useState } from 'react';
import { Download, Chrome, ShieldCheck, CheckCircle, RefreshCcw, HelpCircle, ArrowRight } from 'lucide-react';

export default function ChromeExtensionTab() {
  const [downloading, setDownloading] = useState(false);
  const [installedSimulator, setInstalledSimulator] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setInstalledSimulator(true);
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5" id="chrome-ext-tab-root">
      {/* Extension Headline Card */}
      <div className="bg-slate-900 text-white rounded-lg p-4 relative overflow-hidden text-xs space-y-3 shadow-md">
        <div className="absolute top-0 right-0 p-3 opacity-20">
          <Chrome className="w-12 h-12 text-amber-400 animate-spin-slow" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-[9px] tracking-wide uppercase">Oficial</span>
          <span className="text-slate-350 font-mono font-semibold">Extensão v1.1.2</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase">Extensão JurisCalc SP</h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Capture e calcule guias de DARE e boletos de E-PROC automaticamente direto do navegador.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ${
            installedSimulator 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-amber-500 text-slate-950 hover:bg-amber-600'
          }`}
          id="btn-download-crx"
        >
          {downloading ? (
            <>
              <RefreshCcw className="h-4.5 w-4.5 animate-spin" />
              <span>Baixando Extensão (.CRX)...</span>
            </>
          ) : installedSimulator ? (
            <>
              <CheckCircle className="h-4.5 w-4.5" />
              <span>Extensão Ativa no Navegador</span>
            </>
          ) : (
            <>
              <Download className="h-4.5 w-4.5" />
              <span>Instalar no Google Chrome</span>
            </>
          )}
        </button>
      </div>

      {/* Corporate Owner & CNPJ Stamp (Highlighting ownership requested by user) */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-2 text-[11px] shadow-2xs">
        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
          <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
          <span>Propriedade Comercial</span>
        </div>
        <p className="leading-relaxed text-slate-600 font-medium">
          O JurisCalc SP é de propriedade integral e exclusiva da{' '}
          <strong className="text-slate-900 font-extrabold">Camelsec Plataforma</strong>, regulamentada sob o{' '}
          <span className="font-mono bg-slate-200/75 px-1 rounded text-slate-850 font-bold">CNPJ: 51.811.543/0001-20</span>.
        </p>
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>Licença Segura</span>
          <span>Suporte Camelsec ativo</span>
        </div>
      </div>

      {/* Steps of installation */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Passo a Passo para Baixar</h4>
        <div className="space-y-3 text-[11px]">
          <div className="flex gap-2.5 items-start">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-[10px] shrink-0">1</span>
            <p className="text-slate-600 pt-0.5 font-medium">
              Clique no botão de download acima para baixar o pacote seguro da extensão oficial <strong className="text-slate-800">Camelsec</strong>.
            </p>
          </div>
          <div className="flex gap-2.5 items-start">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-[10px] shrink-0">2</span>
            <p className="text-slate-600 pt-0.5 font-medium">
              Acesse <code className="bg-slate-100 px-1 py-0.5 rounded text-red-650 font-mono text-[10px]">chrome://extensions</code> em uma nova aba do seu navegador Chrome.
            </p>
          </div>
          <div className="flex gap-2.5 items-start">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-[10px] shrink-0">3</span>
            <p className="text-slate-600 pt-0.5 font-medium">
              Ative o <strong className="text-slate-800">Modo do Desenvolvedor</strong> localizado no canto superior direito e arraste o arquivo baixado.
            </p>
          </div>
        </div>
      </div>

      {/* Auto Integration Features Highlights */}
      <div className="p-3.5 bg-amber-50/65 border border-amber-200 rounded-lg space-y-2">
        <h4 className="text-[11px] font-bold text-amber-850 uppercase tracking-wider flex items-center">
          <Chrome className="w-4 h-4 mr-1.5 text-amber-500" />
          Sincronização Ativa Integrada
        </h4>
        <ul className="space-y-1.5 text-[11.5px] text-slate-600 font-medium">
          <li className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-1.5 text-amber-600" />
            <span>Identifica o tipo de processo nas instâncias cíveis do TJSP.</span>
          </li>
          <li className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-1.5 text-amber-600" />
            <span>Verifica o preenchimento de guias DARE em tempo real.</span>
          </li>
          <li className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-1.5 text-amber-600" />
            <span>Puxa o Valor Atualizado da Causa direto do e-SAJ e do E-PROC.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
