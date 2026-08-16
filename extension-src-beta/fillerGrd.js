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

  // Remove acentos por faixa de código (sem regex de combining chars, para o
  // fonte ficar 100% ASCII) e junta espaços repetidos, igual ao norm() do
  // filler.js do TJSP.
  function norm(s) {
    var d = (s || '').normalize('NFD');
    var out = '';
    for (var i = 0; i < d.length; i++) {
      var code = d.charCodeAt(i);
      if (code >= 0x0300 && code <= 0x036f) continue;
      var c = d[i].toUpperCase();
      if (c === ' ' || /[A-Z0-9]/.test(c)) {
        if (c === ' ' && (out.length === 0 || out[out.length - 1] === ' ')) continue;
        out += c;
      }
    }
    return out.replace(/ $/, '');
  }

  // Combobox customizado (não é <select>): clica para abrir, digita no campo
  // de busca do overlay e clica na primeira opção cujo texto bate.
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
      disparar(busca);
      setTimeout(function () {
        var alvo = norm(valor);
        var candidatos = [].slice
          .call(document.querySelectorAll('li, [role="option"], [class*="option"]'))
          .filter(function (el) {
            return el.offsetParent && el.textContent && el.textContent.trim().length > 0;
          });
        var opcao =
          candidatos.filter(function (el) {
            return norm(el.textContent) === alvo;
          })[0] ||
          candidatos.filter(function (el) {
            return norm(el.textContent).indexOf(alvo) >= 0;
          })[0];
        if (opcao) {
          opcao.click();
        } else {
          console.warn('[JuriscalcSP] GRD: "' + valor + '" não achado em "' + rotulo + '". Selecione à mão.');
          botao.click(); // fecha o overlay para não atrapalhar os campos seguintes
        }
        setTimeout(prosseguir, 300);
      }, 600);
    }, 300);
  }

  function preencher(dados) {
    var c = dados.camposPorRotulo || {};
    preencherCombobox('Comarca / Fórum', c['Comarca / Fórum'], function () {
      preencherTexto('Valor do depósito', c['Valor do depósito']);
      preencherTexto('Número do processo', c['Número do processo']);
      preencherTexto('Ano do processo', c['Ano do processo']);
      preencherTexto('CPF ou CNPJ', c['CPF ou CNPJ']);
      preencherTexto('Depositante / remetente', c['Depositante / remetente']);
      preencherTexto('Nome do autor', c['Nome do autor']);
      preencherTexto('Nome do réu', c['Nome do réu']);
      // O CEP dispara uma busca assíncrona de endereço na própria página
      // (preenche Endereço/Bairro/Município/UF sozinho). Preenchemos por
      // cima só o que ela não resolver, depois de dar tempo pra responder.
      preencherTexto('Cep', c['Cep']);
      setTimeout(function () {
        preencherTexto('Endereço do depositante / remetente', c['Endereço do depositante / remetente'], true);
        preencherTexto('Bairro', c['Bairro'], true);
        preencherTexto('Município', c['Município'], true);
        preencherTexto('UF', c['UF'], true);
        console.log(
          '[JuriscalcSP] GRD: campos preenchidos. Confira Vara Judicial (não automatizado) e o restante antes de clicar em Avançar.'
        );
      }, 1500);
    });
  }
})();
