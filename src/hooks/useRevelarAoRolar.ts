/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Revela um elemento quando ele entra na viewport.
 *
 * IntersectionObserver em vez de biblioteca de animação: são poucas linhas e a
 * homepage é a porta de entrada, onde peso de bundle custa conversão.
 *
 * A animação em si é a `animate-fadeSlideUp` que a plataforma já usa nas trocas
 * de seção — mesma curva, mesma duração. Quem pediu `prefers-reduced-motion` já
 * está atendido pelo `index.css`, que zera a duração globalmente.
 */
export function useRevelarAoRolar<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = ref.current;
    if (!alvo) return;

    // Sem suporte ao observer, mostra direto em vez de esconder para sempre.
    if (typeof IntersectionObserver === 'undefined') {
      setVisivel(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisivel(true);
            observer.disconnect(); // revela uma vez só
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(alvo);
    return () => observer.disconnect();
  }, []);

  return { ref, visivel };
}
