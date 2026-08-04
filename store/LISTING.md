# Ficha da Chrome Web Store — JudsCalc SP

Textos prontos para colar no painel da Chrome Web Store ao publicar a extensão
(visibilidade **Não listada**).

---

## Nome
JudsCalc SP — Custas TJSP

## Resumo (summary — máx. 132 caracteres)
Calculadora de custas e preparos do TJSP (e-SAJ e E-PROC) em painel lateral. Auditoria sob a Lei Estadual nº 11.608/2003.

## Categoria
Ferramentas (Tools)

## Idioma
Português (Brasil)

## Descrição detalhada
O JudsCalc SP é uma calculadora e auditora de custas processuais do Tribunal de
Justiça de São Paulo (TJSP), disponível como painel lateral do Chrome para uso
junto aos sistemas e-SAJ e E-PROC.

Recursos:
• Cálculo de taxa judiciária, preparo recursal e despesas processuais conforme a
  Lei Estadual nº 11.608/2003 e a Tabela Prática do TJSP.
• Correção monetária pelas tabelas oficiais (Lei 14.905/2024, INPC e IPCA-E),
  acompanhando os índices mensais publicados pelo TJSP.
• Discriminação por guia (DARE 230-6, FEDTJ 120-1, GRD) com valor pronto para
  recolhimento.
• Preenchimento automático da guia DARE no Portal de Custas do TJSP, a partir do
  cálculo já feito.
• Memória de cálculo pronta para copiar e colar em petições.

Todos os cálculos são realizados localmente, no seu navegador. A extensão não
coleta dados pessoais.

Propriedade de Plataforma Camelsec Ltda (CNPJ 51.811.543/0001-20).

## Prática de privacidade (declaração)
Não coleta, não armazena e não transmite dados pessoais. Os cálculos rodam
inteiramente no navegador. O armazenamento local guarda apenas (a) os dados da
guia que o próprio usuário mandou emitir e (b) uma cópia da tabela de índices
oficiais do TJSP.

## URL da política de privacidade
https://juriscalc2.netlify.app/privacidade/

---

## Screenshots necessários (você precisa gerar)
A loja exige pelo menos **1 screenshot** de **1280×800** ou **640×400** px.
Sugestão: abra o painel lateral (extensão carregada) com um cálculo preenchido e
capture a tela. 2–3 imagens deixam a ficha mais completa.

---

## Aba "Práticas de privacidade" (respostas prontas)

> IMPORTANTE: cada texto abaixo tem de corresponder ao que está em
> `extension-src/manifest.json`. A revisão da loja recusa a submissão quando a
> declaração de privacidade contradiz o manifest. Ao mexer nas permissões,
> atualize esta seção junto.

**Finalidade única (single purpose):**
Calcular custas e preparos processuais do TJSP e, a pedido do usuário, preencher
a guia correspondente no Portal de Custas oficial do próprio Tribunal.

**Justificativa da permissão `sidePanel`:**
Exibir a calculadora no painel lateral, ao lado dos sistemas e-SAJ e E-PROC, sem
tirar o usuário da tela do processo.

**Justificativa da permissão `storage`:**
Guardar localmente, no navegador, apenas dois itens: os dados da guia que o
usuário mandou emitir (para que o preenchimento no portal do TJSP funcione entre
uma aba e outra) e uma cópia da tabela de índices oficiais do TJSP, que serve de
cache. Nada é enviado para fora do navegador.

**Justificativa do host `https://portaldecustas.tjsp.jus.br/*`:**
Preencher automaticamente o formulário da guia DARE no Portal de Custas do TJSP
com os valores já calculados, quando o usuário aciona a emissão. Sem esse acesso
o preenchimento automático não funciona e os valores teriam de ser redigitados.

**Justificativa do host `https://juriscalc2.netlify.app/*`:**
Baixar `indices.json`, um arquivo estático com as Tabelas Práticas de Atualização
Monetária publicadas pelo TJSP. O tribunal divulga um índice novo por mês; buscar
esse arquivo mantém a correção monetária correta sem exigir uma nova versão da
extensão a cada mês. É apenas leitura de dados públicos — nenhuma informação do
usuário é enviada.

**Justificativa dos content scripts:**
`bridge.js` e `filler.js` atuam somente em
`portaldecustas.tjsp.jus.br/portaltjsp/pages/custas/*`, para preencher o
formulário da guia. `appbridge.js` atua apenas no site do próprio produto, para
enviar os dados do cálculo à extensão.

**Código hospedado remotamente (remotely hosted code):** NÃO.
O arquivo `indices.json` é dado (JSON com valores numéricos), não código. Nada
baixado é executado — o conteúdo é validado e usado apenas como tabela de
consulta.

**Uso de dados (marcar):**
- NÃO coleta nem usa dados do usuário.
- Marque as 3 certificações finais:
  1. Não vendo/transfiro dados a terceiros fora dos usos aprovados;
  2. Não uso/transfiro dados para fins não relacionados à finalidade única;
  3. Não uso/transfiro dados para verificar solvência ou conceder crédito.
