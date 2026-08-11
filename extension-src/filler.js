// Content script (mundo MAIN — mesma janela da página, com acesso ao window.jQuery).
// Lê os dados expostos pelo bridge.js (atributo data-juds-guia) e preenche o
// formulário do Portal de Custas do TJSP, seguindo o fluxo já validado:
//   dados pessoais + dropdowns (Chosen) -> Avancar -> modal (processo/valores) -> salvar servico.
// PARA aqui de propósito: o usuário confere e clica em "Emitir Guia".
(function () {
  // Remove acentos sem usar regex de combining chars (mantém o fonte 100% ASCII).
  //
  // Tambem descarta o que nao for letra, numero ou espaco, e junta espacos
  // repetidos. Onze municipios de SP tem apostrofo ou hifen no nome
  // ("Santa Barbara d'Oeste", "Embu-Guacu", "Pariquera-Acu") e o portal nao
  // necessariamente usa o mesmo caractere que o IBGE -- apostrofo reto contra
  // curvo ja seria suficiente para o nome nunca casar.
  function norm(x) {
    var d = (x || '').normalize('NFD');
    var out = '';
    for (var i = 0; i < d.length; i++) {
      var code = d.charCodeAt(i);
      if (code >= 0x0300 && code <= 0x036f) continue; // acento
      var c = d[i].toUpperCase();
      if ((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')) out += c;
      else if (out.length && out[out.length - 1] !== ' ') out += ' ';
    }
    return out.replace(/ $/, '');
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
    // Casa por texto. Serve para UF e municipio, onde o rotulo identifica.
    //
    // Tenta o nome exato primeiro e so depois cai no substring, porque 30 dos
    // 645 municipios de SP estao contidos no nome de outro. Como o portal lista
    // em ordem alfabetica, o antigo "primeiro que contem" errava sempre que o
    // nome maior vinha antes: "Uru" selecionava Bauru, "Leme" selecionava
    // Clementina, "Itu" selecionava Boituva. Errado e sem aviso.
    //
    // No substring, escolhe o rotulo mais curto entre os candidatos -- o mais
    // proximo do alvo. Isso cobre tanto "Itu" contra "Itupeva" quanto um portal
    // que escreva "SAO PAULO - SP" em vez de "SAO PAULO".
    function opt(id, alvo) {
      if (!alvo) return false;
      var e = document.getElementById(id);
      if (!e) return false;
      var lista = [].slice.call(e.options);
      var n = norm(alvo);

      var o = lista.filter(function (x) {
        return norm(x.text) === n;
      })[0];

      if (!o) {
        o = lista
          .filter(function (x) {
            return n && norm(x.text).indexOf(n) >= 0;
          })
          .sort(function (a, b) {
            return norm(a.text).length - norm(b.text).length;
          })[0];
      }

      if (!o) {
        // Antes daqui saia em silencio, e a guia era emitida com o campo
        // vazio sem ninguem perceber.
        console.warn('[JuriscalcSP] "' + alvo + '" nao existe em #' + id + '. Selecione a mao.');
        return false;
      }
      $(e).val(o.value).trigger('change').trigger('chosen:updated');
      return true;
    }

    // Seleciona pelo `value` exato do <option>.
    // Usado no tipo de servico: quatro opcoes contem "Cartas Precatorias" e
    // duas contem "Acao Penal Privada", entao casar por texto pegaria a
    // primeira parecida e emitiria a guia com o servico errado.
    function optPorValor(id, valor) {
      if (!valor) return false;
      var e = document.getElementById(id);
      if (!e) return false;
      var o = [].slice.call(e.options).filter(function (x) {
        return x.value === valor;
      })[0];
      if (!o) {
        console.warn('[JuriscalcSP] Servico "' + valor + '" nao existe no portal. Selecione a mao.');
        return false;
      }
      $(e).val(o.value).trigger('change').trigger('chosen:updated');
      return true;
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
    optPorValor('tipoServicos', dados.tipoServico);

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
              // Cada servico do portal pede um conjunto diferente de campos:
              // Reconvencao tem valorLitisconsorcio e nao tem valorCondenacao;
              // Recurso Inominado tem valorReceitaCustasIniciais. Em vez de
              // listar todos aqui, o site manda o mapa `campos` e a extensao
              // preenche o que existir na pagina.
              //
              // Isso e proposital: descobrir um campo novo passa a ser mudanca
              // de DADO no site, nao de codigo na extensao -- ou seja, sem
              // passar por nova revisao da Chrome Web Store.
              var campos = dados.campos || {};
              Object.keys(campos).forEach(function (idCampo) {
                txt(idCampo, campos[idCampo]);
              });
              // PARA AQUI DE PROPOSITO.
              //
              // Nao clicamos em "Adicionar" (bt_salvar_servico): quem confere e
              // adiciona e o usuario. Servicos como a Peticao Inicial abrem
              // campos que a extensao nao preenche (comarca, foro, classe,
              // partes), e adicionar antes disso salvaria um servico incompleto.
              // Alem disso, o valor da guia so vale se alguem olhou.
              console.log(
                '[JuriscalcSP] Campos preenchidos. Confira, complete o que faltar ' +
                  'e clique em Adicionar quando estiver tudo certo.'
              );
            }, 3000);
          }, 1500);
        }, 800);
      } else if (n > 25) {
        clearInterval(t);
      }
    }, 300);
  }
})();
