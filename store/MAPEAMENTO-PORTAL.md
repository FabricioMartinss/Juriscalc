# Mapeamento: enquadramentos → serviços do Portal de Custas

Referência de qual "Tipo de Serviço" do
[Portal de Custas](https://portaldecustas.tjsp.jus.br/portaltjsp/pages/custas/new)
cada enquadramento do app usa na emissão automática.

A fonte da verdade é `src/data/servicosPortal.ts` — esta página existe para
registrar **o que já foi conferido contra o portal** e o que ainda é suposição.

O autofill seleciona pelo `value` do `<option>`, não pelo rótulo: quatro opções
contêm "Cartas Precatórias" e duas contêm "Ação Penal Privada", então casar por
texto pegaria a primeira parecida e emitiria a guia errada.

## Situação

| Enquadramento | Serviço no portal | Receita | Conferido no portal |
|---|---|---|---|
| comum_1 Inicial / Reconvenção / Embargos | `PETICAO_INICIAL` + 2 opções | 230-6 | ✅ 05/08/2026 (as 3) |
| comum_2 Execução de título extrajudicial | `EXECUCAO_TITULO_EXTRA_JUDICIAL` | 230-6 | ❌ |
| comum_3 Apelação / Recurso adesivo | `PREPARO_APELACAO` + 1 opção | 230-6 | ❌ |
| comum_4 Instauração de cumprimento | `COMPRIMENTO_SENTENCA` | 230-6 | ❌ |
| comum_5 Cumprimento de julgado externo | `COMPRIMENTO_SENTENCA` | 230-6 | ❌ |
| comum_6 Satisfação da execução | `SATISFACAO_EXECUCAO` | 230-6 | ❌ |
| comum_7 Execução fiscal | `TAXA_JUDICIARIA_EXECUCAO_FISCAL` | 230-6 | ❌ |
| comum_8 Agravo de instrumento | `AGRAVO_INSTRUMENTO` | **234-3** | ❌ |
| comum_9 Cartas | `CARTA_PRECATORIA` + 3 opções | **233-1** | ❌ |
| comum_10 Partilha / inventário | `CAUSA_EM_QUE_HAJA_PARTILHA` | 230-6 | ✅ 05/08/2026 |
| comum_11 Habilitação retardatária | `HABILITACAO_RETARDATARIA_CREDITO_CONCORDATA` | 230-6 | ✅ 05/08/2026 |
| comum_12 Ações penais em geral | `ACAO_PENAL_GERAL` | 230-6 | ❌ |
| comum_13 Ação penal privada | `ACAO_PENAL_PRIVADA_INICIAL` + 1 opção | 230-6 | ❌ |
| comum_14 Litisconsórcio ativo voluntário | `LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR` | 230-6 | ✅ 05/08/2026 |
| comum_15 Litisconsorte ulterior | `LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR` | 230-6 | ❌ |
| jec_1 Recurso inominado | `RECURSO_INOMINADO_JUIZADO_ESPECIAL_CIVEL` | 230-6 | ✅ 05/08/2026 |
| jec_2 Cumprimento no JEC | `COMPRIMENTO_SENTENCA` | 230-6 | ❌ |
| jec_3 Ausência injustificada | `SATISFACAO_EXECUCAO` | 230-6 | ❌ |
| jec_4 Despesas finais pendentes | `SATISFACAO_EXECUCAO` | 230-6 | ❌ |

**Conferido no portal** significa: o autofill foi executado de verdade, o
serviço certo ficou selecionado e os campos de valor foram preenchidos com os
valores esperados. Só o `jec_1` passou por isso até agora — os demais são
mapeamento declarado, ainda não observado.

Um script cruza `servicosPortal.ts` com o `<select>` ao vivo e confirma que
todos os 21 identificadores existem. Isso garante que o serviço **existe**, não
que ele seja o **correto** para o ato.

## Campos de valor

Cada serviço pede um conjunto próprio. Observados até agora:

| Campo do portal | Aparece em | Recebe |
|---|---|---|
| `valorCausa` | maioria | valor da causa informado |
| `valorReceita` | todos | valor calculado da DARE |
| `valorCondenacao` | serviços recursais | só quando há condenação líquida |
| `valorReceitaCustasIniciais` | Recurso Inominado | parcela de ingresso |
| `valorLitisconsorcio` | Reconvenção, Petição Inicial | sobretaxa de litisconsórcio |
| `valorMonteMor` | Causa em que Haja Partilha | monte-mor informado |
| `valorAtualizadoCredito` | Habilitação Retardatária | crédito informado |

Por isso a extensão não tem lista fixa de campos: quem emite manda um mapa
`id → valor` e o `filler.js` preenche o que existir na página, ignorando o
resto. Errar um id não quebra nada — só não preenche.

**Atenção:** este arquivo já afirmou que descobrir um campo novo não exigia
revisão da Chrome Web Store. **Isso deixou de valer** quando a emissão passou a
existir só na extensão. O `filler.js` continua genérico, mas quem monta o mapa é
o `WizardCalculator`, que hoje é empacotado dentro do painel lateral. Campo novo
= build da extensão = nova revisão.

Dá para recuperar a propriedade servindo o mapa como JSON do site, do mesmo
jeito que `indicesRemotos.ts` já faz com `indices.json` — com versão de formato,
cache, prazo e queda para o embutido. Vale quando a frequência de campos novos
justificar; até lá, agrupe os campos e gaste uma revisão para vários.

Duas regras importam:

**Parcelas calculadas** declaram seu destino em `campoPortal` (nos itens do
cálculo). Sem declaração, somam em `valorReceita`.

**Dados informados** só são enviados se o enquadramento os declarar em `inputs`.
Antes o app mandava `valorCausa` sempre, e um valor de um cálculo anterior
entrava numa guia de um enquadramento que nem exibe esse campo.

**Destinos ainda desconhecidos:** `valorSatisfacao` (comum_6) e `valorCredito`
(comum_4 e 5). Desde a v2.5.0 o que o app não preenche **aparece no painel**
para digitar, em vez de o usuário só descobrir ao chegar no portal.

`valorPagoAutor` saiu desta lista: **não é campo do portal.** É entrada de
cálculo do comum_15, e o destino sempre foi o `valorReceita` pelo total
calculado. Estava listado como "destino desconhecido", o que dava a entender
que faltava mapear um campo que nunca existiu. Vale desconfiar do mesmo para
`valorSatisfacao` e `valorCredito` — os dois também são entradas de cálculo, e
podem não ter campo próprio na página. Conferir antes de declarar.

### Litisconsórcio — conferido em 13/08/2026

Serviço `LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR` (comum_14 e comum_15). O
formulário pede exatamente dois campos: `valorCausa*` e `valorReceita*`.

O app manda só o `valorReceita`. O `valorCausa` **nunca era preenchido**, porque
nem comum_14 nem comum_15 declaram esse dado em `inputs` — o 14 pergunta a
quantidade de autores, o 15 o valor pago pelo autor original. A guia saía com um
campo obrigatório em branco. Agora ele aparece no painel.

Não foi marcado como `obrigatorio`: o portal exibe `*`, mas o comum_14 consta
como conferido "sem reclamar de campo obrigatório". Provas conflitantes — travar
o botão à toa é pior que deixar o portal reclamar, que é visível e recuperável.
Se o portal barrar, é trocar uma linha.

## Duas coisas descobertas ao inspecionar

**O portal tem CAPTCHA:** `captcha_contribuinte_cpfCnpj`, visível, ao lado de
`contribuinte_cpfCnpj_button`. A extensão não toca nele nem deve. Fica o
registro: se a emissão automática parar de funcionar sem motivo aparente, é o
primeiro lugar para olhar.

**Dropdown com Chosen aparece como `SELECT` + `oculto`** no dump de campos. O
Chosen esconde o `<select>` original e desenha o próprio widget, então
`offsetParent` fica nulo. É essa a assinatura de um campo que exige mudança na
extensão (precisa de `chosen:updated`) e não só um id novo em
`CAMPOS_POR_SERVICO`. Hoje são três: `cmb_estados`, `cmb_cidades` e
`tipoServicos` — todos já tratados pelo `opt()`.

**O portal não usa `<label for>`.** Os rótulos vêm do texto ao redor, por isso o
`scripts/dump-campos-portal.js` sobe na árvore em vez de casar por `for`.

## Campos que variam por serviço

`CAMPOS_POR_SERVICO`, em `src/data/servicosPortal.ts`, declara o que cada
serviço pede além dos seis fixos do contribuinte.

A chave é o **serviço**, não o enquadramento — é o serviço que determina o que a
página renderiza. `comum_1` sozinho vira Petição Inicial, Reconvenção ou
Oposição de Embargos, e a Reconvenção tem `valorLitisconsorcio` e não exibe
`valorCondenacao`.

O inverso também existe: `comum_14` e `comum_15` caem no mesmo serviço. Por isso
a lista diz só **o que a página pede**; quem preenche cada campo é decidido na
tela. O `camposParaDigitar` mostra ao usuário apenas o que o cálculo não cobre,
cruzando com `destinoDoDado`. Consequência útil: ensinar o app a calcular um
desses campos faz ele sumir do formulário sozinho, sem editar esta lista.

Campos sem `obrigatorio` não travam o botão — em branco, o usuário preenche no
portal, como antes.

### Serviços já inspecionados

| Serviço | Campos da página | O que faltava |
|---|---|---|
| `LITISCONSORCIO_ATIVO_VOLUNTARIO_ULTERIOR` | `valorCausa*`, `valorReceita*` | `valorCausa` |
| `SATISFACAO_EXECUCAO` | `valorCausa*`, `valorCondenacao`, `valorReceita*` | ambos |
| `COMPRIMENTO_SENTENCA` | `valorCondenacao*`, `valorReceita*` | `valorCondenacao` |
| `CARTA_PRECATORIA_PROCESSO_OUTRO_TRIBUNAL` | ver abaixo | quase tudo |

Nenhum dos três "destinos desconhecidos" existia como campo do portal:
`valorPagoAutor`, `valorSatisfacao` e `valorCredito` são todos **entradas de
cálculo**, e o resultado sempre saiu pelo `valorReceita`.

O conjunto **não é previsível** entre serviços. O Cumprimento de Sentença não
tem `valorCausa`, ao contrário dos outros dois — não extrapole, inspecione.

### As Cartas são outro formato

`CARTA_PRECATORIA_PROCESSO_OUTRO_TRIBUNAL` não usa `txt_numeroProcesso` nem
`bt_validar_processo`, e não tem `valorCausa`, `novoProcesso` nem `instancia`.
Em vez disso pede a origem: `tribunalOrigem`, `estadoServico`, `comarcaOrigem`,
`numeroProcessoOrigem`, `forosDeprecado`, `valorReceita*`.

O filler mandava o processo para `txt_numeroProcesso`, que não existe aqui —
a guia saía sem processo. Resolvido com `preencherCom: 'processo'` em
`numeroProcessoOrigem`, já que é o mesmo número.

Faltam conferir os outros três serviços de carta.

### Dropdowns (Chosen)

Campos `select: true` vão num mapa `selects` separado, e não em `campos`. O
`txt()` só dispara eventos de input; o widget do Chosen continuaria exibindo o
valor antigo. O filler casa pelo `value` do `<option>` primeiro e só cai no
texto se não achar — `value` é identificador estável, rótulo é texto de tela.

As opções ficam em `OPCOES_SELECT`, colhidas do próprio portal. Campo
`select: true` **sem** lista colhida não trava nada: o painel avisa em amarelo o
que falta completar no portal.

Listas colhidas em 13/08/2026:

- `estadoServico` — 27 UFs, com ids internos do portal que não seguem sigla nem
  código do IBGE (PR=1, MA=2, SP=26). Transcrever exato, não dá para deduzir.
- `forosDeprecado` — 524 unidades do TJSP, em `src/data/forosTJSP.ts`, geradas
  por `scripts/gen-foros.mjs`. **Não é encadeada ao estado**: a carta vem de
  fora, mas é sempre deprecada para uma unidade paulista.
- `tribunalOrigem` — **depende do serviço**, e por isso não está em
  `OPCOES_SELECT`. A precatória oferece 5 ramos da Justiça; a carta de ordem
  acrescenta STF e STJ, que são quem a expede. Chavear só pelo id ofereceria
  tribunal indevido em metade dos casos. É para isso que existe `opcoes` no
  próprio campo, com precedência sobre a lista global.

A lição vale para as próximas colheitas: **conferir o mesmo campo em cada
serviço** antes de tratar a lista como global.

### Para adicionar um campo

1. No portal, escolha o serviço e inspecione o formulário (F12)
2. Anote o `id` de cada input que o app não preenche
3. Acrescente em `CAMPOS_POR_SERVICO` sob a chave do serviço
4. `npm run check:campos` — confere que o serviço existe, que não há id
   repetido, e relata quais enquadramentos passam a pedir o campo
5. Teste com a extensão sem compactação antes de submeter

O script não substitui a conferência no portal: ele valida a coerência do mapa
consigo mesmo, não que o `id` esteja certo. Id errado falha em silêncio — o
campo simplesmente não é preenchido.

**A conferir:** `comum_2`, `comum_5` e `comum_7` na regra anterior a 03/01/2024
geram duas parcelas (distribuição + satisfação). Se o portal separar a receita
nesses casos, basta declarar o `campoPortal` das parcelas.

## Processo novo pede muito mais

Quando o campo oculto `novoProcesso` vale `true`, o portal também pede
instância, comarca, foro, ofício, serventia, classe e partes. Com processo
existente, ele preenche tudo sozinho a partir do número validado.

**São três serviços, não um** (conferido em 13/08/2026): `PETICAO_INICIAL`,
`EXECUCAO_TITULO_EXTRA_JUDICIAL` e `ACAO_PENAL_PRIVADA_INICIAL` — os atos que
iniciam processo, onde não existe número a validar. Este arquivo dizia que era
só a Petição Inicial.

Nesses três, `txt_numeroProcesso` e `bt_validar_processo` **não existem**, então
o passo de validação do filler vira no-op — mesma situação das cartas de outro
tribunal.

Os campos do bloco, conferidos:

| Campo | Controle |
|---|---|
| `rd_instancia_1`, `rd_instancia_2` | **radio** — nem `txt()` nem `opt()` servem |
| `cmb_comarca1/2_ativa_alocacao` | Chosen, encadeado |
| `cmb_foro1/2_ativo_alocacao` | Chosen, encadeado à comarca |
| `cmb_oficio1/2_ativo_alocacao` | Chosen, encadeado ao foro |
| `cmb_serventia1/2_ativa_alocacao` | Chosen, encadeado ao ofício |
| `cmb_classe` | Chosen, lista grande |
| `parteCpfCnpj`, `parteNome` | texto |
| `semParteCheck`, `multiplasPartesCheck` | **checkbox** |
| `participacaoSelecionada` | Chosen |
| `bt_add_partes_processo` | botão — partes entram uma a uma |

Note o **1 e o 2**: são dois conjuntos de alocação, ainda não sabemos se são
polo ativo e passivo ou principal e alternativo. Descobrir antes de automatizar.

Três tipos de controle novos aparecem aqui — radio, checkbox e botão de repetir
— nenhum coberto por `txt()` ou `opt()`. Este bloco exige extensão nova, não só
dado.

**Decisão: esses campos ficam manuais.** São dados do processo, não do cálculo; as
listas são enormes (~500 classes, ~300 comarcas) e virariam uma segunda cópia
para manter atualizada; e os dropdowns são encadeados, o que torna o
preenchimento automático lento e quebradiço.

## Município é outra coisa — e tem lista fixa

O `cmb_cidades` **não** é a comarca: fica no bloco do contribuinte, junto de CPF,
nome, telefone e endereço. É o município do endereço de quem paga.

Por isso ele foge da decisão acima e tem lista fechada em `src/data/municipiosSP.ts`:
são 645 nomes, não encadeados, e o conjunto é estável há décadas.

O campo era texto livre até a v2.4.0, e o `opt()` casava o que foi digitado
contra o `<select>` do portal pelo primeiro rótulo que **contivesse** o texto.
Isso errava em silêncio:

- Nome digitado errado não casava com nada e o `opt()` retornava sem avisar. A
  guia era emitida com a cidade em branco.
- **30 dos 645 municípios estão contidos no nome de outro.** Como o portal lista
  em ordem alfabética, quem vem antes ganhava. Dez casos saíam errados sempre:
  `Uru`→Bauru, `Leme`→Clementina, `Itu`→Boituva, `Poá`→Marapoama,
  `Tietê`→Igaraçu do Tietê, `São Pedro`→Águas de São Pedro,
  `Lindóia`→Águas de Lindóia, `Itararé`→Bom Sucesso de Itararé,
  `Paranapanema`→Mirante do Paranapanema, `Rinópolis`→Marinópolis.

O campo passou a ser um `<input list>` com `<datalist>`: clicar mostra os 645
nomes, digitar filtra por trecho, e o botão de emitir só libera com um município
da lista. Isso elimina o primeiro caso.

Para o segundo, o `opt()` do filler passou a tentar o nome exato antes do
substring, e a escolher o rótulo **mais curto** entre os candidatos quando cai
no substring. O `norm()` também passou a descartar pontuação, porque onze
municípios têm apóstrofo ou hífen no nome e não há garantia de que o portal use
o mesmo caractere que o IBGE. Quando nada casa, agora sai `console.warn` em vez
de silêncio.

O que vai para a extensão é sempre o nome oficial, resolvido por
`chaveMunicipio()` — não o texto digitado. A chave reduz o nome a letras e
números, então "leme", "SAO CARLOS" e "santa barbara doeste" chegam ao portal
como `Leme`, `São Carlos` e `Santa Bárbara d'Oeste`. Os 645 nomes geram 645
chaves distintas, conferido.

## A extensão para antes de "Adicionar"

O autofill preenche e **não clica em Adicionar** (`bt_salvar_servico`). Quem
confere e adiciona é o usuário. Serviços como a Petição Inicial abrem campos que
a extensão não preenche, e adicionar antes disso salvaria um serviço incompleto.

## Pontos em aberto

**jec_4 tem uma tensão de código.** O app calcula esse enquadramento como FEDTJ
**120-1** (`source: 'FEDTJ'`, despesas de correio, oficial e editais), mas o
serviço escolhido é `SATISFACAO_EXECUCAO`, que é **230-6**. A memória de cálculo
e a guia sairiam com códigos diferentes. Decidir se o cálculo muda de código ou
se a guia sai por outra via.

**Seis serviços do portal não têm enquadramento próprio:**
`MANDADO_SEGURANCA`, `ACAO_RECISORIA`, `CAUTELAR_INOMINADA`, `EMBARGO_INFRIGENTE`,
`ACAO_DIRETA_INCONSTITUCIONALIDADE`, `INTERVENCAO_ESTADUAL_FEDERAL`.
Hoje cairiam em "Petição Inicial". A alíquota provavelmente é a mesma, mas a
guia sairia com nome diferente do ato praticado. Candidatos a enquadramentos
futuros.

## Como conferir um caso

1. `npm run dev` e abra `http://localhost:3000/app` (a extensão precisa estar
   carregada; o manifest já libera `localhost:3000`)
2. Escolha o enquadramento, preencha o cálculo e os dados de emissão
3. Clique em emitir e espere o portal abrir
4. Confira **três coisas**: o serviço selecionado no dropdown, os campos de
   valor preenchidos, e se o portal aceita sem reclamar de campo obrigatório
5. Marque ✅ com a data na tabela acima
