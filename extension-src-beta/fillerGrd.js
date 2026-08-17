// Content script (mundo MAIN) — preenche a "Emissão de Guias — Condução de
// Oficiais de Justiça" (GRD) no site do Banco do Brasil
// (boleto.apps.bb.com.br/emissao-guia).
//
// BETA — diferente do portal do TJSP (jQuery + ids fixos), este é um app
// Angular moderno: a maior parte dos campos tem `id` em UUID, sorteado a cada
// carregamento da página, então a extensão casa pelo texto do rótulo
// (`aria-label`), não pelo id. Dois campos (Valor do depósito, CPF ou CNPJ)
// não têm `aria-label` no portal — para esses há um fallback específico mais
// abaixo, documentado no próprio código.
//
// A página só valida o número do processo (contra o TJSP de verdade) quando
// se clica em "Avançar" — o que vem depois disso ainda não foi conferido, e
// por isso o preenchimento para exatamente aqui, igual ao portal do TJSP: o
// usuário confere Vara Judicial e o resto antes de avançar.
(function () {
  function getDados() {
    try {
      var d = document.documentElement.getAttribute('data-juds-guia');
      var o = d ? JSON.parse(d) : null;
      return o && o.guia === 'grd' ? o : null;
    } catch (e) {
      return null;
    }
  }

  function porRotulo(rotulo) {
    var e = document.querySelector('[aria-label="' + rotulo.replace(/"/g, '') + '"]');
    if (e) return e;
    // Dois campos deste formulário não têm aria-label. Achados pela posição,
    // que é estável porque a ordem dos campos no formulário não muda:
    // "Valor do depósito" é sempre o primeiro <input> da página, e "CPF ou
    // CNPJ" é sempre o <input> logo antes de "Depositante / remetente".
    var inputs = [].slice.call(document.querySelectorAll('input'));
    if (rotulo === 'Valor do depósito') return inputs[0] || null;
    if (rotulo === 'CPF ou CNPJ') {
      var dep = document.querySelector('[aria-label="Depositante / remetente"]');
      var i = dep ? inputs.indexOf(dep) : -1;
      return i > 0 ? inputs[i - 1] : null;
    }
    return null;
  }

  var iniciado = false;
  var tentativas = 0;
  var espera = setInterval(function () {
    tentativas++;
    var dados = getDados();
    var pronto = porRotulo('Comarca / Fórum');
    if (dados && pronto && !iniciado) {
      iniciado = true;
      clearInterval(espera);
      preencher(dados);
    } else if (tentativas > 60) {
      clearInterval(espera);
    }
  }, 400);

  function disparar(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Angular só percebe o valor via o setter nativo do input — `.value = x`
  // direto não dispara o binding, e o formulário continuaria vendo o campo
  // como vazio mesmo com o texto na tela.
  var setterNativo = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

  function preencherTexto(rotulo, valor, soSeVazio) {
    if (!valor) return;
    var e = porRotulo(rotulo);
    if (!e) {
      console.warn('[JuriscalcSP] GRD: campo "' + rotulo + '" não encontrado.');
      return;
    }
    if (soSeVazio && e.value) return; // já preenchido (ex.: pela busca de CEP)
    setterNativo.call(e, valor);
    disparar(e);
  }

  // Combobox customizado (não é <select>): abre e filtra sozinho, mas NÃO
  // clica na opção.
  //
  // Testado à exaustão: o clique na opção só funciona com um clique de
  // verdade do usuário (evento "trusted"). `.click()`, e até a sequência
  // completa pointerdown/mousedown/pointerup/mouseup/click via
  // `dispatchEvent`, não selecionam nada aqui — o componente (um CDK/listbox
  // Angular) parece checar `event.isTrusted`. Um content script não tem como
  // gerar isso; só a extensão com a permissão invasiva "debugger" conseguiria,
  // e isso não vale o alarme que causaria numa extensão de custas judiciais.
  //
  // Então o combo abre, digita a busca e filtra a lista pra 1 opção — falta
  // só o clique do usuário, que já enxerga a opção certa e sozinha na tela.
  function preencherCombobox(rotulo, valor, prosseguir) {
    if (!valor) {
      prosseguir();
      return;
    }
    var botao = porRotulo(rotulo);
    if (!botao) {
      console.warn('[JuriscalcSP] GRD: combobox "' + rotulo + '" não encontrado.');
      prosseguir();
      return;
    }
    botao.click();
    setTimeout(function () {
      var busca = document.querySelector('input[placeholder="Pesquisar..."]');
      if (!busca) {
        console.warn('[JuriscalcSP] GRD: busca de "' + rotulo + '" não abriu.');
        prosseguir();
        return;
      }
      setterNativo.call(busca, valor);
      // A lista só filtra com `keyup` — só `input`/`change` não bastam aqui,
      // ao contrário dos campos de texto comuns da página.
      busca.dispatchEvent(new Event('input', { bubbles: true }));
      busca.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      console.log(
        '[JuriscalcSP] GRD: "' + rotulo + '" filtrado para "' + valor + '" — clique na opção pra confirmar.'
      );
      setTimeout(prosseguir, 500);
    }, 300);
  }

  function preencher(dados) {
    var c = dados.camposPorRotulo || {};
    preencherTexto('Valor do depósito', c['Valor do depósito']);
    preencherTexto('Número do processo', c['Número do processo']);
    preencherTexto('Ano do processo', c['Ano do processo']);
    preencherTexto('CPF ou CNPJ', c['CPF ou CNPJ']);
    preencherTexto('Depositante / remetente', c['Depositante / remetente']);
    preencherTexto('Nome do autor', c['Nome do autor']);
    preencherTexto('Nome do réu', c['Nome do réu']);
    // O CEP dispara uma busca assíncrona de endereço na própria página
    // (preenche Endereço/Bairro/Município/UF sozinho). Preenchemos por cima
    // só o que ela não resolver, depois de dar tempo pra responder.
    preencherTexto('Cep', c['Cep']);
    setTimeout(function () {
      preencherTexto('Endereço do depositante / remetente', c['Endereço do depositante / remetente'], true);
      preencherTexto('Bairro', c['Bairro'], true);
      preencherTexto('Município', c['Município'], true);
      preencherTexto('UF', c['UF'], true);
      // Comarca/Fórum vai por último de propósito: abrir e digitar no
      // combobox dispara um `blur` sintético (via `disparar`) que o
      // FocusMonitor do Angular CDK enxerga em qualquer input da página, e
      // ele fecha o overlay como se o foco tivesse saído dele. Preenchendo
      // tudo antes, nada mexe mais nos outros campos depois de abrir o combo,
      // e ele fica aberto e filtrado esperando o clique do usuário.
      preencherCombobox('Comarca / Fórum', c['Comarca / Fórum'], function () {
        // Vara Judicial não dá pra preencher (ver o comentário no
        // WizardCalculator) — só ecoamos o que foi digitado no painel, pra
        // não sumir da vista de quem vai escolher no site.
        if (dados.varaJudicialLembrete) {
          console.log('[JuriscalcSP] GRD: Vara Judicial a escolher no site: "' + dados.varaJudicialLembrete + '".');
        }
        console.log(
          '[JuriscalcSP] GRD: campos preenchidos. Falta confirmar Comarca/Fórum (lista já filtrada, só clicar) ' +
            'e escolher Vara Judicial (não automatizado) antes de Avançar.'
        );
      });
    }, 1500);
  }
})();
