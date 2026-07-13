// Content script que roda na PÁGINA DO APP (juriscalc2.netlify.app / localhost).
// Faz a ponte entre o app e a extensão sem precisar do ID da extensão:
//  - o app manda window.postMessage({type:'JUDS_EMITIR_GUIA', dados})
//  - aqui guardamos os dados e pedimos ao background para abrir o portal
//  - o app pode detectar a extensão ouvindo 'JUDS_EXT_PRONTA'
(function () {
  function anunciar() {
    window.postMessage({ type: 'JUDS_EXT_PRONTA' }, '*');
  }

  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data) return;
    var d = ev.data;

    // O app pergunta se a extensão está presente.
    if (d.type === 'JUDS_PING') {
      anunciar();
      return;
    }

    // O app pede para emitir a guia com os dados calculados.
    if (d.type === 'JUDS_EMITIR_GUIA' && d.dados) {
      try {
        chrome.storage.local.set({ guiaDados: d.dados }, function () {
          chrome.runtime.sendMessage({ type: 'ABRIR_PORTAL' });
        });
      } catch (e) {
        // extensão sem contexto (ex.: recarregada) — ignora silenciosamente
      }
    }
  });

  // Avisa a página, assim que carrega, que a extensão está ativa.
  anunciar();
})();
