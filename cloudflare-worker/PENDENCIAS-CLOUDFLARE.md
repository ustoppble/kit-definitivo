# O que falta na Cloudflare

> **Atualizado em 13/08 — o funil está completo.** Worker publicado, deploy
> automático funcionando, entrega dos dois produtos gravada e testada de ponta a
> ponta, redirects da Eduzz apontados. **Sobrou um item, e ele não trava a venda.**

## Já está feito

| | |
|---|---|
| Worker publicado, deploy por `git push` | ✅ |
| Rotas `www` e apex | ✅ |
| `LINK_DE_ACESSO` — o Drive dos 51 e-mails | ✅ testado, entrega |
| `SANDBOX_ACESSO` — o Drive das automações | ✅ testado, entrega |
| Redirects de obrigado na Eduzz | ✅ Kit → `oto.html`, AC → `diagnostico.html` |
| Teste A/B (`/a` e `/b`) | ✅ |

## O que falta

| # | Site | O quê |
|---|---|---|
| **1** | **Cloudflare** | `EDUZZ_PRODUTO_UPSELL` = o código do produto de R$49,99 ([como descobrir](#13-eduzz_produto_upsell)) |
| **2** | **Eduzz** | Uma compra real de R$17 pra validar webhook, tags e alertas |

**Os dois se resolvem numa tacada.** A compra de teste do item 2 é o que produz o
payload que o item 1 precisa: com o log stream aberto durante a compra, o código
do produto aparece na tela.

**Sem o item 1 nada quebra.** Toda compra é tratada como Kit — que é o padrão
seguro. O pior caso é quem comprar a oferta de R$49,99 não receber as automações;
nunca o contrário. Mas é pendência real: enquanto durar, a oferta não entrega.

**Se for rolar o token** (só se ele tiver aparecido em live — [ver](#rolar-o-token--só-se-apareceu-em-live)),
agora pode: os secrets já estão gravados, então rolar não tira mais o caminho de
gravar.

---

# Referência

O que cada passo significa, e o que fazer se der errado.

## O que já está pronto

Para não procurar o que não existe:

| | Estado |
|---|---|
| Worker publicado com o código atual do repo | ✅ |
| Rotas `www` e apex, as duas no `wrangler.toml` | ✅ 200 |
| KV `COMPRADORES` + cron de 5 min | ✅ |
| Deploy automático do Worker por `git push` | ✅ workflow verde |
| `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no GitHub | ✅ — rolar só se tiver aparecido em live |
| Teste A/B (`/a` e `/b`) | ✅ nada a fazer |

Agora **tudo sobe com `git push`** — páginas pelo GitHub Pages, Worker pelo
workflow. Não há mais passo manual de publicação.

---

## Os três secrets de entrega

**`LINK_DE_ACESSO` e `SANDBOX_ACESSO` já estão gravados e testados** — as duas
entregas funcionam. Falta só o `EDUZZ_PRODUTO_UPSELL`. O procedimento abaixo
serve pra ele, e pra trocar qualquer um dos outros dois.

### Como gravar, sem login no painel

O `CLOUDFLARE_API_TOKEN` que o Laschuk passou **é** o acesso — ele substitui o
login. Num terminal, uma vez por sessão:

```powershell
$env:CLOUDFLARE_API_TOKEN = "cole_o_token_aqui"
cd "C:/Users/hill/OneDrive/Documentos/Claude/blackbird/kit-51-emails/cloudflare-worker"
```

Depois, um comando por secret. Cada um **pergunta o valor e esconde o que você
digita** — por isso nem o token nem os links entram no histórico do terminal:

```powershell
npx.cmd wrangler@4 secret put EDUZZ_PRODUTO_UPSELL --name blackbird-kit-51-emails
```

Conferir no fim. Lista só os nomes, nunca os valores:

```powershell
npx.cmd wrangler@4 secret list --name blackbird-kit-51-emails
```

**`npx.cmd`, não `npx`.** O PowerShell bloqueia o wrapper `npx.ps1` por política
de execução e devolve "running scripts is disabled on this system". O `.cmd` é o
mesmo programa e não passa por essa checagem.

**`--name`, e aí o `cd` nem importa.** Sem ele o wrangler procura o
`wrangler.toml` na pasta atual e erra com "Required Worker name missing".

Secrets sobrevivem a `wrangler deploy`: grava uma vez e acabou.

Se algum comando reclamar que não sabe qual conta usar, é porque o token enxerga
mais de uma. Aí falta o Account ID — está no `CLOUDFLARE_ACCOUNT_ID` do GitHub, ou
no painel em Workers & Pages → Overview:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "cole_o_account_id_aqui"
```

> **O `$env:` vale só naquela janela.** Fechou o terminal, o token some da
> memória — que é exatamente o que se quer. E nunca gravar o valor em arquivo
> dentro do repo (`.env`, `.dev.vars`): um `git add .` distraído publica ele.

**Se preferir o painel** (aí precisa de login na conta): Workers & Pages →
`blackbird-kit-51-emails` → **Settings** → **Variables and Secrets** → **Add** →
tipo **Secret** (encrypted, não **Text**).

### 1.1 `LINK_DE_ACESSO` ✅

O link real de acesso ao Kit — o Drive/Notion/Docs com os 51 e-mails.

Sem ele: o comprador confirma o e-mail em `obrigado.html` e **não recebe nada**.

> Este é o motivo de o secret existir. O repositório é público; se o link
> estivesse no HTML, qualquer pessoa pegaria o Kit sem comprar. Ele só sai do
> Worker depois que o e-mail bate com a lista de compradores.

### 1.2 `SANDBOX_ACESSO` ✅

O documento no Drive com **o link de cada automação**. O comprador abre cada um
com a conta dele do ActiveCampaign logada, e as automações entram por ali.

É um documento, e não um link de instalação único, porque são várias automações —
e o secret guarda um valor só.

Sem ele: quem comprou a oferta de R$49,99 abre `diagnostico.html` e não recebe as
automações.

> O nome do secret é histórico. A entrega já foi acesso a uma conta sandbox; hoje
> é o link de instalação. Não vale a pena renomear — o nome também está nas
> chaves do KV.

### 1.3 `EDUZZ_PRODUTO_UPSELL` ❌ **← o que falta**

O identificador do produto **Active Campaign By Laschuk (R$49,99)** na Eduzz.

Sem ele: **toda compra é tratada como Kit**, e a entrega do AC nunca acontece.

Esse é o padrão seguro, de propósito — o pior caso é o comprador da oferta não
receber, nunca alguém receber sem ter comprado. Mas é uma pendência real.

**Como descobrir o valor** — precisa de um payload real da Eduzz:

1. Cloudflare → o Worker → **Logs** → **Begin log stream**
2. Fazer uma compra de teste (ou disparar a notificação de teste no painel da
   Eduzz)
3. Procurar a linha `[eduzz-webhook] payload recebido:`
4. Pegar o valor de `product_cod`, `product_id` ou `product_name` do produto de
   R$49,99

O Worker aceita **lista separada por vírgula**, e compara por "contém", sem
diferenciar maiúscula. Então dá para colocar mais de uma pista:

```
8017V3XQ07, active campaign by laschuk
```

⚠️ **Use o código inteiro, nunca um pedaço.** A comparação é por substring: um
valor curto demais casaria também com o produto do Kit, e aí toda compra de R$17
liberaria a entrega de R$49,99.

> **Pelo CLI, se preferir:** `cd cloudflare-worker && npx wrangler secret put LINK_DE_ACESSO`
> (repetir para os outros dois). Secrets sobrevivem a `wrangler deploy` — não
> precisam ser recriados a cada publicação.

---

## Rolar o token — só se apareceu em live

**Condicional.** O `CLOUDFLARE_API_TOKEN` não vazou por ter sido passado de mão
em mão: isso foi entrega de acesso, e é o que permite gravar os secrets sem login
no painel. O que motiva o roll é outra coisa — o próprio Laschuk registrou que o
valor **pode ter aparecido em texto durante uma live**.

**Então a pergunta é uma só: apareceu na live?**

- **Não** — nada a fazer. Guardar o token fora do repositório e seguir.
- **Sim** — rolar, porque quem congelou o frame consegue publicar código no Worker
  que atende `blackbird.ac` e ler o KV `COMPRADORES`, onde estão os e-mails de
  quem comprou.

**Se for rolar:**

1. Cloudflare → perfil → **API Tokens** → o token da zona `blackbird.ac` →
   **Roll** → copiar o valor novo. **Roll**, não **Create**: mantém permissões e
   nome, então nada mais precisa ser reconfigurado.
2. GitHub → `ustoppble/kit-definitivo` → **Settings** → **Secrets and variables**
   → **Actions** → editar `CLOUDFLARE_API_TOKEN` → colar → **Update secret**.
3. Guardar o valor novo em lugar seguro — é o acesso da Suelem à Cloudflare.

O item 2 não acrescenta segurança nenhuma: ele conserta o que o 1 quebra. Sem ele, o próximo
`git push` que toque o Worker falha com
`Authentication error [code: 10000]`, que não diz o motivo.

> **Apagar o arquivo local não invalida o token** — só o roll invalida. E o painel
> de secrets do GitHub mostra só **quando** o valor foi alterado, nunca **qual**
> é: aquela data não responde se o token já foi rolado. Quem responde é a
> Cloudflare.

---

## O que o deploy já resolveu

Não precisa fazer nada aqui. Fica registrado porque muda como as próximas
alterações funcionam.

**O Worker agora publica sozinho.** `git push` que toque `cloudflare-worker/**`
dispara o workflow, que publica e confere que as 5 páginas do funil voltaram 200.
Documentação (`.md`, `.docx`) na mesma pasta não dispara deploy.

**O `worker.js` em produção é o do repositório** — incluindo o checkout do upsell
a R$49,99 com `?cupom=900FF` e o pré-preenchimento de nome/e-mail/telefone.

> A rede de segurança na `oto.html`, que forçava o cupom pelo navegador, virou
> no-op: o Worker agora devolve exatamente o que ela forçava. Pode sair quando
> alguém mexer no arquivo; manter não custa nada.

### A pegadinha que custou uma rota

`wrangler deploy` **sincroniza as rotas com o `wrangler.toml`** — ele não
acrescenta, ele iguala. A rota do apex (`blackbird.ac/kit-51-emails*`) existia só
no painel, então o primeiro deploy automático apagou ela, e quem digitasse o
domínio sem `www` caía no Webflow.

Corrigido no commit `cb60fda`: as duas rotas estão declaradas no arquivo. **A
regra que fica:** o `wrangler.toml` é a verdade sobre rotas, KV e cron. O que for
criado só pelo painel some no deploy seguinte.

---

## Conferir que funcionou (opcional, 1 minuto)

Com um terminal, sem esperar uma compra real. Trocar `SEU_TOKEN` pelo valor do
secret `EDUZZ_WEBHOOK_SECRET` que já existe no Worker.

```bash
# 1. simula uma compra aprovada
curl -X POST "https://www.blackbird.ac/kit-51-emails/api/eduzz-webhook?secret=SEU_TOKEN" \
  -H "content-type: application/json" \
  -d '{"status":"pago","client_email":"teste@exemplo.com"}'

# 2. o e-mail agora deve destravar o Kit
curl -X POST https://www.blackbird.ac/kit-51-emails/api/verificar-acesso \
  -H "content-type: application/json" \
  -d '{"email":"teste@exemplo.com"}'
```

O segundo comando tem que devolver `{"ok":true,"kit_url":"..."}` **com o link
dentro**. Se vier `kit_url` vazio ou `null`, o `LINK_DE_ACESSO` não foi salvo.

Um e-mail que não passou pelo passo 1 devolve `{"ok":false}` — é o gate
funcionando.

---

## Apêndice

**Publiquei e não aparece.** O Worker guarda a resposta do GitHub por 300s.
Ou espera 5 minutos, ou **Caching → Configuration → Purge Cache**.

**Ver o que o Worker está fazendo.** Workers & Pages → o Worker → **Logs** →
**Begin log stream**. Fica em tempo real; `[observability]` já está ligado no
`wrangler.toml`, então o histórico também é gravado.

**O que não fazer:**

- Não preencher **Custom domain** nas Settings → Pages do repositório. O Pages
  precisa continuar respondendo em `ustoppble.github.io`, que é o origin do
  Worker. Preencher ali quebra o proxy.
- Não commitar arquivo `CNAME` no repositório, pelo mesmo motivo.

---

## Fora da Cloudflare, mas trava junto

O passo 4. Dois redirects na **Eduzz** — é o que faz a corrente andar sozinha:

| Produto | Página de obrigado |
|---|---|
| Kit (R$17) | `https://www.blackbird.ac/kit-51-emails/oto.html` |
| Active Campaign (R$49,99) | `https://www.blackbird.ac/kit-51-emails/diagnostico.html` |

Preencher nos **dois** campos de cada produto — Cartão/Pix **e** Boleto. Faltando
um, o comprador cai na página padrão da Eduzz e some do funil.

Hoje a Eduzz manda o comprador do Kit para `upsell.html`, que existe só como
ponte e redireciona para `oto.html`. Por isso a ordem não importa e ninguém cai
em 404 no meio da troca.
