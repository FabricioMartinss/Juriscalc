/*
 * Cola no console do DevTools, na pagina do Portal de Custas, para listar os
 * campos do formulario do servico que estiver selecionado.
 *
 *   https://portaldecustas.tjsp.jus.br/portaltjsp/pages/custas/new
 *
 * Rode DEPOIS que os campos de valor aparecerem (escolher o servico, Avancar,
 * validar o processo) -- antes disso metade deles nem existe no DOM.
 *
 * Marca cada campo como [ja] (a extensao ja preenche) ou [NOVO], e identifica
 * os dropdowns com Chosen. Essa distincao importa: o txt() da extensao faz
 * .val() + input/keyup/change/blur, o que resolve caixa de texto, mas Chosen
 * precisa de chosen:updated. Campo CHOSEN exige mudanca na extensao, nao so um
 * id novo em CAMPOS_POR_SERVICO.
 *
 * O fonte usa SO aspas simples, sem crase e sem aspas duplas, de proposito:
 * colar em console passa por terminais e caixas de chat que trocam aspas retas
 * por tipograficas, e ai o script quebra com "Invalid or unexpected token".
 */
(function () {
  var JA_PREENCHE = (
    'contribuinte_cpfCnpj,contribuinte_nome,telefone,endereco,' +
    'cmb_estados,cmb_cidades,tipoServicos,txt_numeroProcesso,' +
    'valorCausa,valorCondenacao,valorMonteMor,valorAtualizadoCredito,' +
    'valorReceita,valorReceitaCustasIniciais,valorLitisconsorcio'
  ).split(',');

  // Casa <label for=id> varrendo os labels, em vez de querySelector com
  // seletor de atributo -- que exigiria aspas dentro da string.
  var labels = [].slice.call(document.querySelectorAll('label'));
  function rotuloDe(el) {
    var l = labels.filter(function (x) {
      return x.htmlFor === el.id;
    })[0];
    return l ? l.textContent.trim().replace(/\s+/g, ' ') : '';
  }

  function tipoDe(el) {
    if (el.tagName === 'SELECT') {
      var irmao = el.nextElementSibling;
      var chosen =
        el.className.indexOf('chosen') >= 0 ||
        (irmao && String(irmao.className).indexOf('chosen') >= 0);
      return chosen ? 'CHOSEN' : 'select';
    }
    if (el.tagName === 'TEXTAREA') return 'textarea';
    return el.type || 'text';
  }

  var campos = [].slice
    .call(document.querySelectorAll('input,select,textarea'))
    .filter(function (el) {
      return el.id && el.type !== 'submit' && el.type !== 'button';
    })
    .map(function (el) {
      var marca = JA_PREENCHE.indexOf(el.id) >= 0 ? '[ja]   ' : '[NOVO] ';
      return (
        marca +
        el.id +
        ' | ' +
        tipoDe(el) +
        ' | ' +
        (el.offsetParent ? 'visivel' : 'oculto') +
        ' | ' +
        rotuloDe(el)
      );
    });

  var servico = document.getElementById('tipoServicos');
  var opcao = servico && servico.options[servico.selectedIndex];

  var saida = ['=== JuriscalcSP - campos do portal ===']
    .concat(['Servico: ' + (opcao ? opcao.text : '(nenhum selecionado)')])
    .concat(['Value:   ' + (servico ? servico.value : '-')])
    .concat([''])
    .concat(campos.length ? campos : ['(nenhum campo com id)'])
    .join('\n');

  console.log(saida);
  try {
    copy(saida);
    console.log('>>> copiado para a area de transferencia.');
  } catch (e) {
    console.log('>>> copie o texto acima manualmente.');
  }
})();
