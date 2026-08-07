# Upsell "Active Campaign By Laschuk" — design

Data: 2026-08-07
Status: aprovado no brainstorming, aguardando revisão do spec

## Objetivo

Vender, logo depois da compra do Kit 51 e-mails (R$17), um upsell de **R$97
(ancorado em R$497)** que dá ao comprador acesso a uma **conta ActiveCampaign
sandbox** onde ele pode ver e copiar as automações, campanhas e estratégias.

Fonte da oferta: VSL em `video cc.mp4.mp4` (110s), transcrita em
"Transcrição relevante" abaixo.

## A oferta

| Item | Valor |
|---|---|
| Preço | R$97 |
| Preço de ancoragem | R$497 |
| Âncora de custo real | R$15.000 (implementação avulsa de AC para cliente) |
| Entrega | Acesso a conta AC sandbox (ver + copiar) |

Provas usadas na copy, todas ditas pelo próprio Laschuk no vídeo:

- 2 anos 100% focado em vender por e-mail marketing para clientes
- R$20M+ vendidos por e-mail marketing nesse período
- O mesmo AC estruturado para o lançamento do Thiago Finch
- Contas de e-commerce que venderam R$10M+ por e-mail

## Arquitetura

Nada de infraestrutura nova. A página entra no repo e no Worker que já estão
no ar.

- Página: `upsell.html` no repo `ustoppble/kit-51-emails`
- URL pública: `https://www.blackbird.ac/kit-51-emails/upsell.html`
- Servida pelo Worker `blackbird-kit-51-emails`, que já faz proxy do prefixo
  `/kit-51-emails*` e reescreve caminhos relativos

### Rotas do Worker

| Rota | Método | Existe? | Função |
|---|---|---|---|
| `/api/verificar-acesso` | POST | sim | valida e-mail contra KV `COMPRADORES` |
| `/api/eduzz-webhook` | POST | sim | recebe evento de compra da Eduzz |
| `/api/upsell-checkout` | POST | **novo** | tagueia, alerta e devolve URL do checkout |

### Secrets e bindings

| Nome | Existe? | Conteúdo |
|---|---|---|
| KV `COMPRADORES` | sim | e-mails de compradores do Kit |
| `EDUZZ_WEBHOOK_SECRET` | sim | token na URL do webhook |
| `LINK_DE_ACESSO` | **não** | link do Kit — pendente, bloqueia a entrega do Kit |
| `AC_API_TOKEN` | novo | token do ActiveCampaign |
| `AC_ACCOUNT` | novo | subdomínio da conta AC |
| `EVOLUTION_URL` / `EVOLUTION_KEY` / `EVOLUTION_INSTANCE` | novo | WhatsApp |
| `ADMIN_WHATSAPP` | novo | seu número, destino do alerta |
| `SANDBOX_ACESSO` | novo | credencial da sandbox (JSON: url, usuário, senha) |
| `SESSAO_HMAC` | novo | chave para assinar o cookie de sessão |
| `CHECKOUT_UPSELL_URL` | novo | URL do checkout Eduzz de R$97 |

Nenhum desses valores entra no HTML ou no repo. Todos vivem como secret do
Worker, no mesmo padrão que o `EDUZZ_WEBHOOK_SECRET` já usa hoje.

## Fluxo

```
compra do Kit (R$17)
  └→ webhook Eduzz → KV COMPRADORES[email] = 1

obrigado.html → comprador digita e-mail → /api/verificar-acesso
  └→ ok:true → Worker seta cookie de sessão assinado (HttpOnly)
             → redireciona para upsell.html

upsell.html
  ├→ "pular e ir direto pro Kit" → usa o cookie → entrega kit_url
  └→ CTA "quero o Active Campaign" → POST /api/upsell-checkout (cookie)
        ├→ AC: tag [KIT51] - Checkout
        ├→ WhatsApp para ADMIN_WHATSAPP
        └→ 200 { url } → browser vai para o checkout Eduzz R$97

compra do upsell (R$97)
  └→ webhook Eduzz (mesma rota, distingue pelo produto)
       ├→ AC: tag [KIT51] - Compra Aprovada
       └→ KV COMPRADORES["sandbox:" + email] = 1 → libera SANDBOX_ACESSO
```

### Por que cookie e não e-mail na URL

`upsell.html` precisa saber quem é o comprador para tagear no AC. Passar o
e-mail em query string cria um link compartilhável que qualquer um usa para se
tagear como comprador, e vaza o e-mail em log de servidor e no Referer.

Em vez disso, `/api/verificar-acesso` passa a setar um cookie `HttpOnly`,
`Secure`, `SameSite=Lax`, com escopo `/kit-51-emails`, contendo
`email|expiração|HMAC(email+expiração, SESSAO_HMAC)`. Validade de 2 horas. O
Worker valida a assinatura antes de aceitar qualquer chamada de upsell. É
stateless — não precisa de KV para sessão.

### A entrega do Kit nunca é bloqueada

O upsell fica **entre** a verificação e a entrega, mas `upsell.html` sempre
mostra um link visível de "pular e ir direto para o Kit". Comprador que não
quer o upsell chega no material em um clique. Prender a entrega atrás do
upsell gera reembolso e chargeback — e o Worker já tem lógica de revogação
que seria acionada à toa.

## Tags no ActiveCampaign

Seguem a convenção que a conta já usa (`[KIT] - Checkout`, `[KIT] - Compra
Aprovada`). O namespace `[KIT51]` é novo e não colide com nenhuma das 34 tags
existentes.

| Tag | Quando |
|---|---|
| `[KIT51] - Checkout` | clicou no CTA do upsell, antes de pagar |
| `[KIT51] - Compra Aprovada` | pagou o upsell de R$97 |

Contato criado ou atualizado via `POST /api/3/contact/sync`, tag aplicada via
`POST /api/3/contactTags`. A tag é criada uma vez, na implementação, e o ID
fica fixo no código — evita uma chamada de busca a cada checkout.

Falha na chamada do AC **não pode derrubar o checkout**: a tag é acessória, a
venda não. As chamadas ao AC e ao WhatsApp vão em `ctx.waitUntil()`, e a
resposta com a URL do checkout sai na hora.

## Alerta no WhatsApp

Disparado junto com a tag `[KIT51] - Checkout`, via Evolution API, para
`ADMIN_WHATSAPP`. É notificação para o Laschuk, não mensagem para o comprador.

Formato: `[KIT51] <email> entrou no checkout do upsell (R$97) — <hora>`.

## Edição do vídeo

O vídeo, como está, contradiz a página em dois pontos:

1. Em 01:00.9–01:23.0 ele descreve **o portal com clone de 1 clique** — que
   não é o que vai ser entregue (sandbox para copiar à mão)
2. Em 01:16 ele diz **R$197**, enquanto a tarja e a página dizem R$97

Os dois trechos estão no mesmo intervalo. A edição é **remover 01:00.9 até
01:23.0** e emendar o resto:

- mantém `00:00.0 → 01:00.9` (credenciais, prova, âncora de R$15 mil)
- corta o miolo (portal + R$197)
- mantém `01:23.0 → 01:50.9` (o CTA: "aperta aqui embaixo")

Cortar o vídeo em 01:00 e parar ali, como cogitado antes, **perderia o CTA**,
que só acontece a partir de 01:31. Por isso a emenda, e não o truncamento.

Resultado: ~88s, sem promessa de portal e sem preço divergente. O corte é um
jump cut em talking head, aceitável no formato.

## Fora de escopo

- O portal com provisionamento de 1 clique descrito no vídeo. Se voltar à
  mesa, é projeto próprio, com spec própria.
- Criar e semear a conta AC sandbox. É pré-requisito operacional, não código.
- `politica-de-privacidade.html` e `termos-de-uso.html`, hoje linkadas e
  dando 404 nas duas páginas existentes.

## Riscos

**A sandbox não pode ser a conta de produção.** A conta atual tem 34 tags de
campanha real, formulários de matrícula e contatos de cliente. Compartilhar
esse login vaza dado de cliente e permite que qualquer comprador apague as
automações. Tem que ser conta AC separada, semeada com os templates. É o item
de maior prazo do projeto e ele é operacional, não técnico.

**Login compartilhado se degrada.** Vários compradores no mesmo acesso, alguém
edita ou apaga. Ou existe reset periódico, ou a sandbox se suja com o tempo.

**Classificação do webhook por palavra-chave.** O Worker decide aprovação e
reembolso procurando `pago`, `aprovad`, `reembols` nos campos do payload. Com
dois produtos na mesma conta Eduzz, o webhook precisa passar a distinguir
**qual** produto foi comprado, senão a compra do Kit libera a sandbox. Isso
exige ver um payload real da Eduzz, como o próprio README do Worker já sugere.

## Testes

1. `/api/upsell-checkout` sem cookie → 401
2. Cookie forjado (HMAC inválido) → 401
3. Cookie expirado → 401
4. Cookie válido → 200 com URL do checkout, tag no AC, WhatsApp recebido
5. AC fora do ar → checkout ainda responde 200 (falha isolada)
6. Webhook do upsell → tag `[KIT51] - Compra Aprovada` + sandbox liberada
7. Webhook do Kit → **não** libera a sandbox
8. `upsell.html` entrega o link de pular para o Kit sem exigir o upsell
9. Página e assets 200 através de `www.blackbird.ac`

## Transcrição relevante

> Nos últimos dois anos eu fiquei 100% focado apenas vendendo através de email
> marketing para os meus clientes. Nesses dois anos eu consegui vender mais de
> 20 milhões. E pela primeira vez você vai poder ter acesso ao meu Active
> Campaign. O mesmo Active Campaign que eu estruturei para atender grandes
> contas com o maior lançamento da história do marketing digital, que foi do
> Thiago Finch. (...) Você vai poder clonar o meu Active Campaign (...)
> estratégias, automações, campanhas. Normalmente eu cobro para fazer a
> implementação de um Active Campaign para um cliente meu 15 mil reais, além
> das comissões. E você não vai precisar pagar tudo isso.
