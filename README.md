# Funil Kit 51 e-mails

Site em `https://www.blackbird.ac/kit-51-emails`.

Estático no GitHub Pages, servido sob o domínio principal por um Cloudflare
Worker que faz proxy reverso. O Worker também guarda a lógica de acesso pago,
as tags no ActiveCampaign e os alertas no Discord.

## As páginas

| Arquivo | Papel | Quem vê |
|---|---|---|
| `index.html` | página de vendas do Kit — R$17 | tráfego frio |
| `oto.html` | Active Campaign By Laschuk — R$97 | quem **acabou de comprar** o Kit |
| `diagnostico.html` | entrega: Kit + Active Campaign | quem **comprou** a oferta |
| `obrigado.html` | entrega: só o Kit | quem **recusou** a oferta |
| `politica-de-privacidade.html` · `termos-de-uso.html` | páginas legais | linkadas no rodapé da index |
| `upsell.html` | ponte: redireciona para `oto.html` | links antigos e o redirect da Eduzz enquanto não for trocado |

```
index → checkout R$17 → PAGOU → oto ─┬─ comprou → checkout R$97 → diagnostico ─┐
                                     └─ recusou ───────────────→ obrigado ─────┴→ TidyCal
```

Nenhum nome de arquivo diz "upsell". O nome fica visível na barra de endereços
do comprador, e jargão de funil ali só serve para o lead estranhar.

`diagnostico.html` e `obrigado.html` fazem a mesma coisa — destravam o material
e mandam para o diagnóstico. São duas páginas porque a copy muda: quem comprou
tem Kit **e** Active Campaign e precisa ativar os dois; quem recusou tem só o
Kit e precisa saber por onde começar.

**As duas entregam o Kit.** Comprar a oferta não pode custar o produto que a
pessoa já tinha pago — por isso a caixa de acesso existe nas duas, não só em uma.

## Como o Worker sabe quem é o comprador

O checkout da Eduzz redireciona para `oto.html` com o e-mail na URL. A página
troca esse e-mail por um **cookie assinado (HMAC, 2h)** e limpa a barra de
endereços.

O e-mail nunca fica na URL depois disso: link com e-mail dentro é
compartilhável — qualquer um se marcaria como comprador — e vaza no `Referer`
para todo domínio de terceiro da página.

Se a Eduzz não mandar o e-mail, a página pede na hora, ali mesmo. Nunca redireciona
para outra tela: quem acabou de clicar em comprar não pode ser desviado.

## Rotas da API

Todas sob `/kit-51-emails/api/`.

| Rota | Quem chama | O que faz |
|---|---|---|
| `visita` | toda página, ao abrir | avisa no Discord (dedupe 6h por visitante) |
| `lead` | formulário da index | cria contato no AC + tag + avisa + guarda nome/telefone (30 dias) |
| `verificar-acesso` | oto, diagnostico, obrigado | valida e-mail no KV, abre a sessão e devolve o link do Kit |
| `sandbox` | diagnostico | devolve o link que instala as automações do AC |
| `upsell-checkout` | botões da oto | tag + aviso + devolve o checkout já com nome/e-mail/telefone |
| `recusar-upsell` | link de recusa | tag + aviso + manda pra `obrigado.html` |
| `agendar-diagnostico` | botão das duas entregas | tag + aviso + manda pro TidyCal |
| `eduzz-webhook` | Eduzz (server-to-server) | libera acesso no KV conforme o produto |

Tag no AC e aviso no Discord vão em `waitUntil`: **a venda nunca cai porque o
ActiveCampaign ou o Discord saiu do ar.**

O nome `sandbox` é histórico e sobrevive nas chaves do KV e no secret. A entrega
deixou de ser acesso a uma conta sandbox: hoje é o link que instala as automações
na conta do próprio comprador.

## Alertas

Todos no canal privado `#kit51-alertas`. Sete eventos: visita, cadastro, compra
do Kit, checkout da oferta, compra da oferta, recusa e agendamento do diagnóstico.

O agendamento vem de um **cron de 5 minutos** que pergunta ao TidyCal por MCP —
o TidyCal não tem webhook. A primeira execução registra o histórico em silêncio,
para não despejar a agenda inteira no canal.

## Tags no ActiveCampaign

`[KIT51] - Novo Lead` (1157) · `- Checkout` (1152) · `- Recusou Upsell` (1153) ·
`- Compra Aprovada` (1154) · `- Agendou Diagnostico` (1156)

## Deploy

**Páginas:** `git push` na `main`. O GitHub Pages reconstrói sozinho. Nada mais
a fazer.

**Worker:** `.github/workflows/deploy-worker.yml` roda a cada push em
`cloudflare-worker/**`. Precisa do secret `CLOUDFLARE_API_TOKEN` no repositório
(Settings → Secrets and variables → Actions). Enquanto ele não existir, o
workflow falha de propósito com a mensagem dizendo isso, e o deploy do Worker
tem que ser manual:

```
cd cloudflare-worker && npx wrangler deploy
```

## O que ainda falta para o funil vender

### Na Eduzz

Apontar a página de obrigado de cada produto. É isso que faz a corrente andar
sozinha:

| Produto | Redireciona para |
|---|---|
| Kit (R$17) | `oto.html` |
| Active Campaign (R$97) | `diagnostico.html` |

Preencher nos dois campos — **Cartão/Pix** e **Boleto**. Falta um, o comprador
cai na página padrão da Eduzz e some do funil.

### Secrets no Worker

Não é código — são valores que só o Laschuk tem. Sem eles o funil roda, mas não
entrega:

| Secret | Sem ele |
|---|---|
| `LINK_DE_ACESSO` | comprador confirma o e-mail e **não recebe o Kit** |
| `SANDBOX_ACESSO` | comprador da oferta não recebe as automações |
| `EDUZZ_PRODUTO_UPSELL` | webhook não distingue produto |

Sobre o último: enquanto não existir, **toda compra é tratada como Kit** e a
entrega do Active Campaign nunca acontece. É o padrão seguro — o pior caso é o
comprador da oferta não receber, nunca o contrário. Para configurar, é preciso
ver um payload real da Eduzz (os logs do Worker já guardam) e descobrir qual
campo identifica o produto.

O checkout de R$97 **não** é secret: mora no código (`CHECKOUT_UPSELL` em
`worker.js`), porque link de checkout é público por natureza — o comprador vê a
URL na barra de endereços. O secret `CHECKOUT_UPSELL_URL` continua valendo como
override, se o link mudar sem deploy.

### Ordem de publicação

O site já está no ar, e hoje a Eduzz manda o comprador do Kit para
`upsell.html`. Por isso a ponte existe: com ela, a ordem entre publicar e
reconfigurar a Eduzz deixa de importar, e nenhum comprador cai em 404 no meio
do caminho.

1. `git push` — republica as páginas
2. Eduzz — trocar os dois redirects
3. Deploy do Worker — sem ele o `?cupom=OTO` e o pré-preenchimento não existem
   em produção, e o comprador do upsell é cobrado R$497
4. Compra real de R$17 para validar webhook, tags e alertas

### Revisão jurídica pendente

`politica-de-privacidade.html` e `termos-de-uso.html` foram escritas a partir do
que o funil realmente faz — quais dados são coletados, para onde vão e por
quanto tempo ficam. Descrevem a operação com precisão, mas **não passaram por
advogado**. Antes de rodar tráfego pago, vale uma revisão, e provavelmente
acrescentar razão social e CNPJ, que hoje não constam.
