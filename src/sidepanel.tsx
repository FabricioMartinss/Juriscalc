/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ponto de entrada do painel lateral (Chrome Side Panel).
 * Reaproveita o app completo de cálculo, ocupando toda a altura da janela.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { inicializarIndices } from './data/indicesRemotos';
import './index.css';

// Busca os fatores publicados antes de montar a árvore — é o que permite à
// extensão já instalada usar um mês novo sem passar por nova revisão da loja.
// Módulos do App leem o último período disponível no corpo do módulo, por isso
// o import só acontece depois da inicialização.
void (async () => {
  await inicializarIndices();
  const { default: SidePanelApp } = await import('./SidePanelApp');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SidePanelApp />
    </StrictMode>,
  );
})();
