/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Homepage pública do JuriscalcSP.
 *
 * Identidade visual herdada da plataforma: navy `#0b2545` no header e no rodapé,
 * ciano como acento, Cormorant nos títulos de exibição, Inter na interface,
 * JetBrains Mono nos valores, e a escala de raios ampliada do `index.css`.
 * Nenhuma cor ou fonte nova foi introduzida.
 *
 * O texto vive em `src/content/homepage.ts` — a copy é provisória.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ArrowRight,
  ShieldAlert,
  BookMarked,
  RefreshCw,
  Zap,
  Check,
  Clock,
} from 'lucide-react';
import { conteudo, ROTA_PLATAFORMA } from '../content/homepage';
import { useRevelarAoRolar } from '../hooks/useRevelarAoRolar';

const ICONES = {
  tabela: BookMarked,
  correcao: RefreshCw,
  velocidade: Zap,
};

/** Marca da plataforma: o mesmo bloco usado no cabeçalho do app. */
function Marca({ escuro = true }: { escuro?: boolean }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-cyan-400 rounded-2xl flex items-center justify-center shadow-md shadow-cyan-500/30 shrink-0">
        <Scale className="w-5 h-5 text-[#0b2545]" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <span
        className={`font-sans font-black tracking-tight uppercase text-xl ${
          escuro ? 'text-white' : 'text-[#0b2545]'
        }`}
      >
        Juriscalc<span className="text-cyan-400">SP</span>
      </span>
    </div>
  );
}

/** Botão principal — mesmo tratamento visual dos botões de ação da plataforma. */
function BotaoPlataforma({ grande = false }: { grande?: boolean }) {
  return (
    <Link
      to={ROTA_PLATAFORMA}
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 font-sans font-bold text-[#0b2545] shadow-md shadow-cyan-500/30 hover:bg-cyan-300 ${
        grande ? 'px-7 py-4 text-base' : 'px-5 py-2.5 text-sm'
      }`}
    >
      <span>{conteudo.cta}</span>
      <ArrowRight
        className={`${grande ? 'w-5 h-5' : 'w-4 h-4'} group-hover:translate-x-0.5`}
        aria-hidden="true"
      />
    </Link>
  );
}

/** Envolve uma seção com a revelação suave ao rolar. */
function Revelar({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visivel } = useRevelarAoRolar<HTMLDivElement>();
  return (
    <div ref={ref} className={`${className} ${visivel ? 'animate-fadeSlideUp' : 'opacity-0'}`}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const [heroNaTela, setHeroNaTela] = useState(true);

  // O botão do cabeçalho só entra depois que o hero sai de vista. Enquanto o
  // hero está visível ele já tem o seu próprio CTA, e dois botões idênticos
  // lado a lado na primeira dobra pesam mais do que ajudam.
  useEffect(() => {
    const alvo = heroRef.current;
    if (!alvo || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entrada]) => setHeroNaTela(entrada.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(alvo);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col antialiased text-slate-900 overflow-x-hidden bg-gradient-to-b from-cyan-50/40 via-slate-50 to-blue-50/40">
      {/* ===== Header fixo ===== */}
      <header className="bg-[#0b2545] text-white sticky top-0 z-50 shadow-lg shadow-blue-950/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-4 px-5 sm:px-6">
          <Marca />
          <div
            className={heroNaTela ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            aria-hidden={heroNaTela}
          >
            <BotaoPlataforma />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== Hero ===== */}
        <section ref={heroRef} className="bg-[#0b2545] text-white" aria-labelledby="hero-titulo">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-14 pb-20 md:pt-20 md:pb-28 text-center animate-fadeSlideUp">
            <h1
              id="hero-titulo"
              className="font-sans font-black tracking-tight text-4xl md:text-5xl leading-tight max-w-4xl mx-auto text-balance"
            >
              {conteudo.hero.titulo}
            </h1>
            <p className="mt-6 font-sans text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
              {conteudo.hero.subtitulo}
            </p>

            <div className="mt-9 flex justify-center">
              <BotaoPlataforma grande />
            </div>

            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs text-blue-200/70 uppercase tracking-wider">
              {conteudo.hero.selos.map((selo, i) => (
                <li key={selo} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden="true" className="text-cyan-400/60">·</span>}
                  <span>{selo}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== Problema ===== */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 -mt-10" aria-labelledby="problema-titulo">
          <Revelar>
            <div className="bg-white border border-cyan-100 rounded-3xl p-7 md:p-10 shadow-sm shadow-cyan-900/5 flex items-start gap-4 md:gap-6">
              <div className="p-3 bg-cyan-50 rounded-2xl border border-cyan-100 shrink-0">
                <ShieldAlert className="w-6 h-6 text-cyan-700" aria-hidden="true" />
              </div>
              <div>
                <h2 id="problema-titulo" className="font-sans font-black tracking-tight text-2xl md:text-3xl text-[#0b2545]">
                  {conteudo.problema.destaque}
                </h2>
                <p className="mt-3 font-sans text-slate-600 leading-relaxed max-w-3xl">
                  {conteudo.problema.texto}
                </p>
              </div>
            </div>
          </Revelar>
        </section>

        {/* ===== Tempo: faz o leitor calcular o custo da propria rotina ===== */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 pt-20 md:pt-24" aria-labelledby="tempo-titulo">
          <Revelar>
            <div className="text-center max-w-3xl mx-auto">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-700">
                {conteudo.tempo.etiqueta}
              </span>
              <h2 id="tempo-titulo" className="sr-only">
                {conteudo.tempo.etiqueta}
              </h2>
            </div>
          </Revelar>

          <div className="mt-8 grid gap-5 md:grid-cols-2 max-w-5xl mx-auto">
            {conteudo.tempo.perguntas.map((pergunta, i) => (
              <Revelar key={pergunta}>
                <div className="h-full bg-white border border-slate-200 rounded-3xl p-7 shadow-xs flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-cyan-700" aria-hidden="true" />
                  </div>
                  <p className="font-sans font-semibold text-lg md:text-xl leading-snug text-[#0b2545]">
                    {pergunta}
                  </p>
                  <span className="sr-only">Pergunta {i + 1}</span>
                </div>
              </Revelar>
            ))}
          </div>

          <Revelar>
            <p className="mt-8 font-sans text-slate-600 text-center max-w-3xl mx-auto leading-relaxed">
              {conteudo.tempo.fecho}
            </p>
          </Revelar>
        </section>

        {/* ===== Recursos ===== */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 py-20 md:py-24" aria-labelledby="recursos-titulo">
          <Revelar className="text-center">
            <h2 id="recursos-titulo" className="font-sans font-black tracking-tight text-3xl md:text-4xl text-[#0b2545]">
              {conteudo.recursos.titulo}
            </h2>
            <p className="mt-3 font-sans text-slate-600 max-w-2xl mx-auto">
              {conteudo.recursos.subtitulo}
            </p>
          </Revelar>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {conteudo.recursos.itens.map((item) => {
              const Icone = ICONES[item.icone];
              return (
                <Revelar key={item.titulo}>
                  <article className="h-full bg-white border border-slate-200 rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-cyan-200 transition-shadow">
                    <div className="w-12 h-12 bg-cyan-50 rounded-2xl border border-cyan-100 flex items-center justify-center">
                      <Icone className="w-6 h-6 text-cyan-700" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-sans font-bold text-lg text-[#0b2545] tracking-tight">
                      {item.titulo}
                    </h3>
                    <p className="mt-3 font-sans text-slate-600 text-sm leading-relaxed">{item.texto}</p>
                  </article>
                </Revelar>
              );
            })}
          </div>
        </section>

        {/* ===== As 19 hipoteses, nomeadas ===== */}
        <section
          className="bg-[#0b2545] text-white"
          aria-labelledby="hipoteses-titulo"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-20 md:py-24">
            <Revelar className="text-center">
              <h2 id="hipoteses-titulo" className="font-sans font-black tracking-tight text-3xl md:text-4xl">
                {conteudo.hipoteses.titulo}
              </h2>
              <p className="mt-3 font-sans text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
                {conteudo.hipoteses.subtitulo}
              </p>
            </Revelar>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {conteudo.hipoteses.grupos.map((grupo) => (
                <Revelar key={grupo.nome}>
                  <div className="h-full bg-white/5 border border-white/10 rounded-3xl p-6 md:p-7">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-cyan-300">
                      {grupo.nome}
                    </h3>
                    <ul className="mt-5 space-y-2.5">
                      {grupo.itens.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 font-sans text-sm text-blue-50/90">
                          <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Revelar>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Demonstração ===== */}
        <section className="bg-white border-y border-slate-200" aria-labelledby="demo-titulo">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-20 md:py-24 grid gap-12 md:grid-cols-2 md:items-center">
            <Revelar>
              <h2 id="demo-titulo" className="font-sans font-black tracking-tight text-3xl md:text-4xl text-[#0b2545]">
                {conteudo.demonstracao.titulo}
              </h2>
              <p className="mt-4 font-sans text-slate-600 leading-relaxed">
                {conteudo.demonstracao.texto}
              </p>
            </Revelar>

            <Revelar>
              {/* Mock do resultado. Valores ilustrativos, marcados como tal. */}
              <div className="bg-[#0b2545] rounded-3xl p-6 md:p-7 shadow-lg shadow-blue-950/20 text-white">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <span className="font-sans font-bold text-sm">{conteudo.demonstracao.enquadramento}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-200 border border-cyan-400/30 shrink-0">
                    {conteudo.demonstracao.etiqueta}
                  </span>
                </div>

                <dl className="py-4 space-y-3">
                  {conteudo.demonstracao.linhas.map((linha) => (
                    <div key={linha.rotulo} className="flex items-center justify-between gap-4 text-sm">
                      <dt className="font-sans text-blue-100/80 flex items-center gap-2">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                        {linha.rotulo}
                      </dt>
                      <dd className="font-mono font-semibold text-white shrink-0">{linha.valor}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <span className="font-sans font-bold">{conteudo.demonstracao.totalRotulo}</span>
                  <span className="font-mono font-bold text-cyan-300 text-lg">
                    {conteudo.demonstracao.totalValor}
                  </span>
                </div>

                <p className="mt-4 font-sans text-[11px] text-blue-200/60 leading-snug">
                  {conteudo.demonstracao.nota}
                </p>
              </div>
            </Revelar>
          </div>
        </section>

        {/* ===== CTA final ===== */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 py-20 md:py-24" aria-labelledby="cta-titulo">
          <Revelar>
            <div className="bg-[#0b2545] rounded-3xl px-7 py-14 md:px-12 text-center shadow-lg shadow-blue-950/20">
              <h2 id="cta-titulo" className="font-sans font-black tracking-tight text-3xl md:text-4xl text-white">
                {conteudo.ctaFinal.titulo}
              </h2>
              <p className="mt-4 font-sans text-blue-100/80 max-w-xl mx-auto leading-relaxed">
                {conteudo.ctaFinal.texto}
              </p>
              <div className="mt-9 flex justify-center">
                <BotaoPlataforma grande />
              </div>
            </div>
          </Revelar>
        </section>
      </main>

      {/* ===== Rodapé ===== */}
      <footer className="mt-auto bg-[#0b2545] text-blue-200/70 py-10 px-5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-2">
            <Marca />
            <p className="font-sans text-xs text-blue-300/60">{conteudo.marca.descritor}</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <ul className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-blue-200/70">
              {conteudo.rodape.mencoes.map((m, i) => (
                <li key={m} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden="true" className="text-cyan-400/60">·</span>}
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="font-sans text-xs text-blue-300/50">{conteudo.rodape.direitos}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
