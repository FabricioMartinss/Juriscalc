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

Por isso a extensão não tem lista fixa de campos: o site manda um mapa
`id → valor` e ela preenche o que existir na página. Descobrir um campo novo é
mudança de **dado no site**, não de código na extensão — não exige nova revisão
da Chrome Web Store.

Duas regras importam:

**Parcelas calculadas** declaram seu destino em `campoPortal` (nos itens do
cálculo). Sem declaração, somam em `valorReceita`.

**Dados informados** só são enviados se o enquadramento os declarar em `inputs`.
Antes o app mandava `valorCausa` sempre, e um valor de um cálculo anterior
entrava numa guia de um enquadramento que nem exibe esse campo.

**Destinos ainda desconhecidos** — o app não preenche e o usuário digita:
`valorSatisfacao` (comum_6), `valorCredito` (comum_4 e 5), `valorPagoAutor`
(comum_15).

**A conferir:** `comum_2`, `comum_5` e `comum_7` na regra anterior a 03/01/2024
geram duas parcelas (distribuição + satisfação). Se o portal separar a receita
nesses casos, basta declarar o `campoPortal` das parcelas.

## Processo novo pede muito mais

Quando o campo oculto `novoProcesso` vale `true` — caso da Petição Inicial —, o
portal também pede instância, comarca, foro, ofício, serventia, classe e partes.
Com processo existente, ele preenche tudo sozinho a partir do número validado.

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
