// Service worker (MV3).
// 1) Abre o painel lateral ao clicar no ícone da extensão.
// 2) Recebe os dados de emissão vindos da plataforma web (juriscalc2.netlify.app),
//    guarda-os e abre o portal certo (TJSP para DARE, Banco do Brasil para
//    FEDTJ e GRD), onde o autofill será executado.

const URL_PORTAL_DARE = 'https://portaldecustas.tjsp.jus.br/portaltjsp/pages/custas/new';
const URL_PORTAL_FEDTJ = 'https://www45.bb.com.br/fmc/frm/fw0707314_1.jsp';
const URL_PORTAL_GRD = 'https://boleto.apps.bb.com.br/emissao-guia';

// `guia` vem no payload que o app monta (ver WizardCalculator). Ausente ou
// desconhecido cai no DARE, que é o comportamento de sempre — assim uma versão
// antiga do app (sem o campo `guia`) continua funcionando sem mudança.
function urlDoPortal(guia) {
  if (guia === 'fedtj') return URL_PORTAL_FEDTJ;
  if (guia === 'grd') return URL_PORTAL_GRD;
  return URL_PORTAL_DARE;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('Falha ao configurar o painel lateral:', err));
});

// Reforça o comportamento quando o service worker reinicia.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Mensagens internas (do content script appbridge, ou do painel lateral
// direto). Os dois já guardaram `guiaDados` no storage antes de mandar isto —
// lemos de volta só para decidir qual portal abrir.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'ABRIR_PORTAL') {
    chrome.storage.local.get('guiaDados', (r) => {
      chrome.tabs.create({ url: urlDoPortal(r && r.guiaDados && r.guiaDados.guia) });
      sendResponse({ ok: true });
    });
    return true; // resposta assíncrona
  }
  return false;
});

// Mensagens vindas do site diretamente (externally_connectable) — caminho alternativo.
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'EMITIR_GUIA' && msg.dados) {
    // Guarda os dados para o content script (bridge/filler) usar na página do portal.
    chrome.storage.local.set({ guiaDados: msg.dados }, () => {
      chrome.tabs.create({ url: urlDoPortal(msg.dados.guia) });
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
