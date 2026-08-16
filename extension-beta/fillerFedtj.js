// Content script (mundo MAIN) — preenche a "Guia de Recolhimento" do FEDTJ no
// site do Banco do Brasil (www45.bb.com.br), a mesma guia usada hoje para
// despesas postais com citações/intimações (código 120-1, cartas AR).
//
// Formulário antigo (JSP simples, sem framework): a maioria dos campos só tem
// `name`, não `id` — por isso o preenchimento busca pelos dois.
//
// BETA: só o cálculo já validado (nome, CPF, processo, endereço, código e
// valor) é preenchido. "Histórico" fica em branco de propósito — é o usuário
// quem descreve o que a despesa cobre (ex.: "3 cartas AR"), como já era antes
// desta extensão existir.
(function () {
  function getDados() {
    try {
      var d = document.documentElement.getAttribute('data-juds-guia');
      var o = d ? JSON.parse(d) : null;
      return o && o.guia === 'fedtj' ? o : null;
    } catch (e) {
      return null;
    }
  }

  var iniciado = false;
  var tentativas = 0;
  var espera = setInterval(function () {
    tentativas++;
    var dados = getDados();
    // `cpf` tem `id` fixo neste formulário — usado só como sinal de "página pronta".
    var pronto = document.getElementById('cpf');
    if (dados && pronto && !iniciado) {
      iniciado = true;
      clearInterval(espera);
      preencher(dados);
    } else if (tentativas > 40) {
      clearInterval(espera);
    }
  }, 300);

  function disparar(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Campo do formulário: busca por `name` primeiro (todos têm), cai para `id`
  // (só metade tem). Id/name errado não quebra nada — só não preenche.
  function txt(chave, v) {
    if (v == null || v === '') return;
    var e = document.getElementsByName(chave)[0] || document.getElementById(chave);
    if (!e) {
      console.warn('[JuriscalcSP] FEDTJ: campo "' + chave + '" não encontrado.');
      return;
    }
    e.value = v;
    disparar(e);
  }

  function preencher(dados) {
    var campos = dados.campos || {};
    Object.keys(campos).forEach(function (chave) {
      txt(chave, campos[chave]);
    });
    console.log(
      '[JuriscalcSP] FEDTJ: campos preenchidos. Escreva o Histórico e confira antes de clicar em "Gerar guia".'
    );
  }
})();
