# Brief de copy — funil Kit 51 e-mails

Você escreve a copy. Não mexe em código, não faz deploy. Entrega arquivos
markdown com a copy pronta, seção por seção, em `docs/copy/`.

## Quem fala

Laschuk. Especialista em e-mail marketing. Voz: direta, sem hype de guru,
específica. Português do Brasil. Ele fala "e-mail marketing", "automação",
"lançamento", "perpétuo", "e-commerce".

Provas reais dele (use, são verdadeiras, ditas por ele em vídeo):

- 2 anos 100% focado em vender por e-mail marketing para clientes
- R$20 milhões vendidos por e-mail nesse período
- Estruturou o ActiveCampaign do lançamento do Thiago Finch
- Contas de e-commerce que venderam R$10M+ por e-mail
- Cobra R$15.000 para implementar um ActiveCampaign para um cliente, mais
  comissão sobre as vendas

NÃO invente número, print, depoimento ou nome de cliente. Se sentir falta de
prova em algum ponto, escreva `[FALTA PROVA: o quê]` e siga.

## Estilo

Russell Brunson. Isso quer dizer, concretamente:

- Hook → história → oferta. A história vem antes do preço, sempre.
- Empilhamento de valor visível: cada item da oferta com valor próprio,
  somados, e o preço final muito abaixo da soma.
- Quebra de objeção nomeada — escreva a objeção como o leitor pensa e responda
- Escassez e urgência REAIS: a oferta some ao fechar a página, e isso é
  verdade porque é one-time offer de funil
- Frases curtas. Parágrafo de uma linha. Muito espaço em branco.
- CTA repetido ao longo da página, não só no fim

## O funil (4 páginas)

Atualizado em 10/08/2026. A estrutura mudou: a OTO de R$297 foi eliminada (era
premissa de copy que nunca foi confirmada) e sobrou **uma única oferta**
pós-compra. Nenhum arquivo do funil se chama "upsell": o nome aparece na barra
de endereços do comprador, e jargão de funil ali só serve para ele estranhar.

```
index → checkout R$17 → oto ─┬─ comprou → diagnostico
                             └─ recusou → obrigado
```

### 1. `index.html` — página de vendas do Kit (JÁ EXISTE, NÃO REESCREVER)
Kit Definitivo do Email Marketing, R$17, 51 e-mails prontos. Só leia para
manter voz e continuidade.

### 2. `oto.html` — R$49,99 (de R$497)
Produto: **Active Campaign By Laschuk**.

**A entrega é a estrutura pronta na conta do comprador.** As automações são
instaladas na conta ActiveCampaign dele por um link de compartilhamento —
montadas e conectadas. O que sobra para ele é ajustar o que é seu: as tags, os
dados da oferta e do comprador.

CUIDADO — o eixo da copy é **estado, não processo**. Escreva "as automações
estão prontas na sua conta". Não escreva "você entra, olha e refaz", que era a
premissa antiga e é falsa; nem "as automações entram/são instaladas", que é
mecanismo — explicar mecanismo confunde o lead e atrasa a venda.

Ter conta ActiveCampaign é pré-requisito de fato. Por decisão de negócio, isso
**não** aparece na página; está nos Termos de Uso.

Âncora: implementação avulsa custa R$15.000.

A página tem um vídeo (VSL) no topo, com autoplay mudo e botão de ativar som.
Logo abaixo do vídeo vêm os dois botões de decisão. Sua copy vem depois deles e
tem que funcionar para quem NÃO assistiu.

Precisa de: headline, subheadline, história, empilhamento de valor, objeções
respondidas, CTA principal e CTAs repetidos, e o texto do link de recusa.

### 3. `diagnostico.html` — entrega para quem COMPROU o AC
Tom: parabéns, você tem as duas peças — o Kit (o que escrever) e o Active
Campaign (quando e para quem sai) — e agora é ativar. Oferta: agendar o
diagnóstico gratuito (TidyCal). A página também destrava o Kit e o AC.

### 4. `obrigado.html` — entrega para quem RECUSOU
Tom: o Kit é seu, e agora, por onde começar? Mesma oferta de diagnóstico, outro
ângulo. A página também destrava o Kit.

As duas terminam no mesmo lugar. São duas páginas porque a copy muda conforme o
que a pessoa comprou. Em ambas, o bloco do diagnóstico é curto, abre com "se
você pular uma coisa hoje, que não seja esta" e o CTA nomeia o que a pessoa
quer, não a tarefa — "QUERO SABER POR ONDE COMEÇAR", nunca "AGENDAR
DIAGNÓSTICO".

## Regras duras

- Preço do upsell é **R$49,99**, ancorado em **R$497**. Nunca R$197.
- Nada de promessa de resultado garantido em reais ("você vai faturar X").
- Não escreva HTML. Markdown, com as seções nomeadas, pronto para eu montar.

## Entrega

Um arquivo por página em `docs/copy/`, com as seções nomeadas na ordem em que
aparecem na página.

Leia antes: o `README.md` da raiz (é a fonte da verdade sobre o funil) e o
`index.html` (voz). Os arquivos em `docs/copy/` e o spec em `docs/superpowers/`
são registro histórico e descrevem a estrutura anterior — não siga a premissa
de entrega deles.
