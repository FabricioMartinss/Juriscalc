# Ficha da Chrome Web Store — JuriscalcSP (Beta FEDTJ/GRD)

Textos prontos para colar ao publicar esta versão como um **item NOVO e
separado** na Chrome Web Store (não como atualização do item oficial —
ver `store/LISTING.md` para o item já publicado, que deve continuar como está).

Visibilidade recomendada: **Não listada** (só quem tem o link instala; não
aparece em busca). Ainda mais importante aqui do que na versão oficial,
porque esta é uma versão de testes.

---

## Nome
JuriscalcSP — Custas TJSP (Beta FEDTJ/GRD)

## Resumo (summary — máx. 132 caracteres)
Versão de testes: calculadora de custas do TJSP com preenchimento automático de DARE, FEDTJ e GRD (Banco do Brasil).

## Categoria
Ferramentas (Tools)

## Idioma
Português (Brasil)

## Descrição detalhada
Versão BETA do JuriscalcSP para testar o preenchimento automático das guias
FEDTJ e GRD, além da DARE já disponível na versão oficial.

Recursos (iguais à versão oficial, mais o que está em teste):
• Cálculo de taxa judiciária, preparo recursal e despesas processuais conforme a
  Lei Estadual nº 11.608/2003 e a Tabela Prática do TJSP.
• Correção monetária pelas tabelas oficiais (Lei 14.905/2024, INPC e IPCA-E).
• Preenchimento automático da guia DARE no Portal de Custas do TJSP.
• NOVO (beta): preenchimento automático da guia FEDTJ (despesas postais,
  código 120-1) e da guia GRD (condução de Oficiais de Justiça) nos sites do
  Banco do Brasil usados para emissão dessas duas guias.

Esta é uma versão experimental para testes internos. Recomenda-se manter a
versão oficial instalada em paralelo. Todos os cálculos são realizados
localmente, no navegador. A extensão não coleta dados pessoais.

Propriedade de Plataforma Camelsec Ltda (CNPJ 51.811.543/0001-20).

## Prática de privacidade (declaração)
Não coleta, não armazena e não transmite dados pessoais. Os cálculos rodam
inteiramente no navegador. O armazenamento local guarda apenas os dados da
guia que o próprio usuário mandou emitir (DARE, FEDTJ ou GRD) e uma cópia da
tabela de índices oficiais do TJSP.

## URL da política de privacidade
https://juriscalcsp.com/privacidade/
(Mesma política da versão oficial — cobre as três guias; ver nota abaixo
sobre mantê-la atualizada.)

---

## Screenshots necessários (você precisa gerar)
Pelo menos 1, de 1280×800 ou 640×400 px. Sugestão: painel lateral aberto,
com o seletor DARE/FEDTJ/GRD visível e um cálculo preenchido.

---

## Aba "Práticas de privacidade" (respostas prontas)

> IMPORTANTE: cada texto abaixo tem que corresponder ao que está em
> `extension-src-beta/manifest.json` desta versão. Ao mexer nas permissões,
> atualize esta seção junto.

**Finalidade única (single purpose):**
Calcular custas e preparos processuais do TJSP e, a pedido do usuário,
preencher a guia correspondente (DARE, FEDTJ ou GRD) no site oficial de
emissão de cada uma.

**Justificativa da permissão `sidePanel`:**
Exibir a calculadora no painel lateral do Chrome, ao lado dos sistemas e-SAJ
e E-PROC.

**Justificativa da permissão `storage`:**
Guardar localmente, no navegador, apenas os dados da guia que o usuário
mandou emitir (para o preenchimento funcionar entre uma aba e outra) e uma
cópia da tabela de índices oficiais do TJSP. Nada é enviado para fora do
navegador.

**Justificativa do host `https://portaldecustas.tjsp.jus.br/*`:**
Preencher automaticamente a guia DARE no Portal de Custas do TJSP com os
valores já calculados.

**Justificativa dos hosts `https://www45.bb.com.br/*` e
`https://boleto.apps.bb.com.br/*`:**
São os dois sites do Banco do Brasil onde o TJSP direciona a emissão das
guias FEDTJ (despesas postais, código 120-1) e GRD (condução de Oficiais de
Justiça) — não são geradas no Portal de Custas do TJSP. A extensão os acessa
somente quando o usuário aciona a emissão dessas guias, para preencher os
campos com os valores já calculados. Nenhum dado é enviado para fora do
navegador; a extensão não envia formulários nem realiza pagamentos — quem
confere e clica em "Gerar guia" é sempre o usuário.

**Justificativa dos hosts `https://juriscalcsp.com/*` e
`https://juriscalc2.netlify.app/*`:**
Endereços do site do próprio produto — recebem os dados do cálculo feito
pelo usuário e servem o arquivo `indices.json` (Tabela Prática de correção
monetária do TJSP, dado público).

**Justificativa dos content scripts:**
`bridge.js` roda em `portaldecustas.tjsp.jus.br`, `www45.bb.com.br` e
`boleto.apps.bb.com.br` só para entregar os dados da guia ao script de
preenchimento correspondente. `filler.js`, `fillerFedtj.js` e `fillerGrd.js`
preenchem os campos de cada guia com os valores calculados, cada um restrito
à página do respectivo site. `appbridge.js` atua apenas no site do produto.

**Código hospedado remotamente (remotely hosted code):** NÃO.

**Uso de dados (marcar):**
- NÃO coleta nem usa dados do usuário.
- Marque as 3 certificações finais (mesmas da versão oficial).

---

## Atenção antes de submeter

A Chrome Web Store costuma revisar com mais cuidado extensões que pedem
acesso a domínios de instituições financeiras — os dois hosts do Banco do
Brasil aqui são exatamente isso. É esperado que a revisão desta versão
demore mais que a da versão oficial, ou que a Google peça esclarecimento
adicional sobre o motivo desse acesso. A justificativa acima foi escrita
pensando nisso; se a Google pedir mais detalhe, o ponto central é: a
extensão só abre esses sites quando o usuário pede, só preenche campos com
valores que o próprio usuário já calculou, e para antes de qualquer envio —
quem confere e submete o formulário é sempre uma pessoa.
