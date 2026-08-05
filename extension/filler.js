// Content script (mundo MAIN — mesma janela da página, com acesso ao window.jQuery).
// Lê os dados expostos pelo bridge.js (atributo data-juds-guia) e preenche o
// formulário do Portal de Custas do TJSP, seguindo o fluxo já validado:
//   dados pessoais + dropdowns (Chosen) -> Avancar -> modal (processo/valores) -> salvar servico.
// PARA aqui de propósito: o usuário confere e clica em "Emitir Guia".
(function () {
  // Remove acentos sem usar regex de combining chars (mantém o fonte 100% ASCII).
  function norm(x) {
    var d = (x || '').normalize('NFD');
    var out = '';
    for (var i = 0; i < d.length; i++) {
      var code = d.charCodeAt(i);
      if (code < 0x0300 || code > 0x036f) out += d[i];
    }
    return out.toUpperCase();
  }
  function getDados() {
    try {
      var d = document.documentElement.getAttribute('data-juds-guia');
      return d ? JSON.parse(d) : null;
    } catch (e) {
      return null;
    }
  }

  // Espera os dados, o jQuery e o formulário ficarem prontos (até ~24s).
  var iniciado = false;
  var tentativas = 0;
  var espera = setInterval(function () {
    tentativas++;
    var dados = getDados();
    var jq = window.jQuery;
    var formPronto = document.getElementById('contribuinte_cpfCnpj');
    if (dados && jq && formPronto && !iniciado) {
      iniciado = true;
      clearInterval(espera);
      preencher(dados, jq);
    } else if (tentativas > 60) {
      clearInterval(espera);
    }
  }, 400);

  function preencher(dados, $) {
    function txt(id, v) {
      if (v == null || v === '') return;
      var e = document.getElementById(id);
      if (!e) return;
      $(e).val(v).trigger('input').trigger('keyup').trigger('change').trigger('blur');
    }
    function opt(id, alvo) {
      if (!alvo) return;
      var e = document.getElementById(id);
      if (!e) return;
      var o = [].slice.call(e.options).filter(function (x) {
        return norm(x.text).indexOf(norm(alvo)) >= 0;
      })[0];
      if (o) {
        $(e).val(o.value).trigger('change').trigger('chosen:updated');
      }
    }
    function click(id) {
      var e = document.getElementById(id);
      if (e) { e.click(); return true; }
      return false;
    }

    // Secao inicial
    txt('contribuinte_cpfCnpj', dados.cpf);
    txt('contribuinte_nome', dados.nome);
    txt('telefone', dados.telefone);
    txt('endereco', dados.endereco);
    opt('cmb_estados', dados.uf || 'SP');
    opt('tipoServicos', dados.tipoServico);

    // Municipio carrega via AJAX apos a UF; espera as opcoes.
    var n = 0;
    var t = setInterval(function () {
      var cid = document.getElementById('cmb_cidades');
      n++;
      if (cid && cid.options.length > 1) {
        opt('cmb_cidades', dados.municipio);
        clearInterval(t);
        setTimeout(function () {
          click('bt_add_servico'); // Avancar -> abre o modal
          setTimeout(function () {
            txt('txt_numeroProcesso', dados.processo);
            click('bt_validar_processo');
            setTimeout(function () {
              txt('valorCausa', dados.valorCausa);
              txt('valorCondenacao', dados.valorCondenacao);
              txt('valorReceita', dados.valorReceita);
              // Servicos com duas exigencias legais (Recurso Inominado do JEC)
              // tem um campo separado para as custas iniciais. Vem vazio quando
              // o servico so tem uma receita, e txt() ignora valor vazio.
              txt('valorReceitaCustasIniciais', dados.valorReceitaCustasIniciais);
              setTimeout(function () {
                click('bt_salvar_servico');
                console.log('[JuriscalcSP] Preenchimento concluido. Confira e clique em Emitir Guia.');
              }, 1500);
            }, 3000);
          }, 1500);
        }, 800);
      } else if (n > 25) {
        clearInterval(t);
      }
    }, 300);
  }
})();
