/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ponto de entrada do painel lateral (Chrome Side Panel).
 * Reaproveita o app completo de cálculo, ocupando toda a altura da janela.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SidePanelApp from './SidePanelApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SidePanelApp />
  </StrictMode>,
);
