// Service worker (MV3).
// 1) Abre o painel lateral ao clicar no ícone da extensão.
// 2) Recebe os dados de emissão vindos da plataforma web (juriscalc2.netlify.app),
//    guarda-os e abre o Portal de Custas do TJSP, onde o autofill será executado.

const URL_PORTAL = 'https://portaldecustas.tjsp.jus.br/portaltjsp/pages/custas/new';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('Falha ao configurar o painel lateral:', err));
});

// Reforça o comportamento quando o service worker reinicia.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Mensagens internas (do content script appbridge, que roda na página do app).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'ABRIR_PORTAL') {
    chrome.tabs.create({ url: URL_PORTAL });
    sendResponse({ ok: true });
  }
  return false;
});

// Mensagens vindas do site diretamente (externally_connectable) — caminho alternativo.
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'EMITIR_GUIA' && msg.dados) {
    // Guarda os dados para o content script (bridge/filler) usar na página do portal.
    chrome.storage.local.set({ guiaDados: msg.dados }, () => {
      chrome.tabs.create({ url: URL_PORTAL });
      sendResponse({ ok: true });
    });
    return true; // resposta assíncrona
  }
  // Permite ao site checar se a extensão está instalada/ativa.
  if (msg && msg.type === 'PING') {
    sendResponse({ ok: true, versao: chrome.runtime.getManifest().version });
    return false;
  }
  sendResponse({ ok: false, erro: 'mensagem invalida' });
  return false;
});
