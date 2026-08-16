// Content script (mundo ISOLADO) — tem acesso ao chrome.storage.
// Lê os dados guardados pelo background e os expõe num atributo do DOM,
// para o filler.js (que roda no mundo da página, com acesso ao jQuery) usar.
(function () {
  try {
    chrome.storage.local.get('guiaDados', function (r) {
      if (r && r.guiaDados) {
        document.documentElement.setAttribute('data-juds-guia', JSON.stringify(r.guiaDados));
        // Consome o dado (uso único), para não repreencher em visitas futuras.
        chrome.storage.local.remove('guiaDados');
      }
    });
  } catch (e) {
    // silencioso: se não houver dados/permite, o filler simplesmente não roda.
  }
})();
