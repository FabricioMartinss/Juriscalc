/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

/** APIs da extensão disponíveis quando o código roda dentro dela. */
export interface ApiExtensao {
  runtime?: {
    id?: string;
    sendMessage(msg: unknown): void;
  };
  storage?: {
    local?: {
      set(itens: Record<string, unknown>): Promise<void>;
      get(chave: string): Promise<Record<string, unknown>>;
      remove(chave: string): Promise<void>;
    };
  };
}

export function apiExtensao(): ApiExtensao | undefined {
  return (globalThis as { chrome?: ApiExtensao }).chrome;
}

/**
 * true quando o código está sendo exibido no painel lateral da extensão.
 *
 * Ali não existe a ponte `appbridge.js` — ela é content script e só roda nas
 * páginas do site. Em compensação, o painel tem acesso direto às APIs da
 * extensão, então a troca de dados sai sem intermediário.
 */
export function noPainelDaExtensao(): boolean {
  return !!apiExtensao()?.runtime?.id;
}

/**
 * Detecta a extensão JuriscalcSP no site (o content script anuncia
 * 'JUDS_EXT_PRONTA'). No painel a presença é certa — nunca chega mensagem
 * porque `appbridge.js` não roda ali dentro.
 */
export function useExtensaoPresente(): boolean {
  const [presente, setPresente] = useState(false);

  useEffect(() => {
    if (noPainelDaExtensao()) {
      setPresente(true);
      return;
    }
    const onMsg = (ev: MessageEvent) => {
      if (ev.source === window && ev.data && ev.data.type === 'JUDS_EXT_PRONTA') {
        setPresente(true);
      }
    };
    window.addEventListener('message', onMsg);
    window.postMessage({ type: 'JUDS_PING' }, '*'); // caso a extensão já esteja pronta
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return presente;
}
