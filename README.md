# Funil Kit 51 e-mails

Site em `https://www.blackbird.ac/kit-51-emails`.

Estático no GitHub Pages, servido sob o domínio principal por um Cloudflare
Worker que faz proxy reverso. O Worker também guarda a lógica de acesso pago,
as tags no ActiveCampaign e os alertas no Discord.

## As páginas

| Arquivo | Papel | Quem vê |
|---|---|---|
| `index.html` | página de vendas do Kit — R$17 | tráfego frio |
| `upsell.html` | Active Campaign By Laschuk — R$97 | quem **acabou de comprar** o Kit |
| `oto.html` | implementação assistida ao vivo — R$297 | quem comprou o upsell |
| `diagnostico.html` | downsell: agendar diagnóstico grátis | quem **recusou** o upsell |
| `obrigado.html` | entrega: destrava o material | fim do funil |

```
index → checkout R$17 → PAGOU → upsell ─┬─ aceita → checkout R$97 → oto → obrigado
                                        └─ recusa → diagnostico → obrigado
```

`obrigado.html` é o **fim** do funil, não o meio: a oferta acontece logo depois
do pagamento, antes da entrega. Quem chega na obrigado já passou pela oferta.

## Como o Worker sabe quem é o comprador

O checkout da Eduzz redireciona para `upsell.html` com o e-mail na URL. A página
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
| `lead` | formulário da index | cria contato no AC + tag + avisa |
| `verificar-acesso` | upsell, oto, obrigado | valida e-mail no KV e abre a sessão |
| `upsell-checkout` | botão do upsell | tag + aviso + devolve URL do checkout |
| `recusar-upsell` | link de recusa | tag + aviso + manda pro diagnóstico |
| `oto-checkout` | botão da OTO | aviso + devolve URL do checkout |
| `agendar-diagnostico` | botão do diagnóstico | tag + aviso + manda pro TidyCal |
| `eduzz-webhook` | Eduzz (server-to-server) | libera acesso no KV conforme o produto |

Tag no AC e aviso no Discord vão em `waitUntil`: **a venda nunca cai porque o
ActiveCampaign ou o Discord saiu do ar.**

## Alertas

Todos no canal privado `#kit51-alertas`. Oito eventos: visita, cadastro, compra
do Kit, checkout do upsell, compra do upsell, recusa, checkout da OTO,
agendamento do diagnóstico.

O agendamento vem de um **cron de 5 minutos** que pergunta ao TidyCal por MCP —
o TidyCal não tem webhook. A primeira execução registra o histórico em silêncio,
para não despejar a agenda inteira no canal.

## Tags no ActiveCampaign

`[KIT51] - Novo Lead` (1157) · `- Checkout` (1152) · `- Recusou Upsell` (1153) ·
`- Compra Aprovada` (1154) · `- OTO Aprovada` (1155) · `- Agendou Diagnostico` (1156)

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

Nada disso é código — são valores que só o Laschuk tem. Sem eles o funil roda,
mas não entrega:

| Secret | Sem ele |
|---|---|
| `LINK_DE_ACESSO` | comprador confirma o e-mail e **não recebe o Kit** |
| `SANDBOX_ACESSO` | comprador do upsell não recebe a credencial |
| `CHECKOUT_UPSELL_URL` | botão do upsell abre destino vazio |
| `CHECKOUT_OTO_URL` | botão da OTO abre destino vazio |
| `EDUZZ_PRODUTO_UPSELL` / `_OTO` | webhook não distingue produto |

Sobre o último: enquanto não existir, **toda compra é tratada como Kit** e a
sandbox nunca libera. É o padrão seguro — o pior caso é o comprador do upsell
não receber, nunca o contrário. Para configurar, é preciso ver um payload real
da Eduzz (os logs do Worker já guardam) e descobrir qual campo identifica o
produto.

Na Eduzz também falta apontar as páginas de obrigado de cada produto:
Kit → `upsell.html`, upsell → `oto.html`, OTO → `obrigado.html`. É isso que faz
a corrente andar sozinha.

## Pendência de produto

A `oto.html` foi montada com uma premissa, não com uma decisão: preço R$297 e
entrega "implementação assistida ao vivo" saíram de uma recomendação de copy que
o Laschuk nunca confirmou. Se a oferta mudar, a página inteira muda. Se não for
existir, é só apagar o arquivo — o funil funciona sem ela.
