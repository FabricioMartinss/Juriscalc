// Service worker (MV3) — abre o painel lateral ao clicar no ícone da extensão.
// O Side Panel do Chrome ocupa toda a altura da janela (do topo ao chão).

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('Falha ao configurar o painel lateral:', err));
});

// Reforça o comportamento também quando o service worker reinicia.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(() => {});
