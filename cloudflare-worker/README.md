# Proxy `www.blackbird.ac/kit-51-emails`

> **Atenção:** este README descreve só o proxy original. O funil completo
> (upsell, OTO, downsell, tags no ActiveCampaign, alertas no Discord e o
> cron do TidyCal) está documentado no `README.md` da raiz do repositório.

O site do Kit fica hospedado no GitHub Pages, mas é servido sob o domínio
principal do Blackbird. Este diretório tem o Worker que faz a ponte.

## Por que precisa de Worker

O GitHub Pages só aceita **hostname** como domínio customizado — `kit.blackbird.ac`
funciona, `www.blackbird.ac/kit-51-emails` não. Não é limite de formatação: o Pages
serve o repositório inteiro na raiz de um host, ele não monta sub-caminho de um
domínio que já tem outro site.

E `blackbird.ac` já tem outro site: o Webflow. Apontar o domínio pro Pages
derrubaria o site principal.

O Worker resolve porque roda na borda da Cloudflare, **antes** da requisição
chegar no Webflow.

## Como o tráfego flui

```
visitante  ->  Cloudflare  ->  rota bate /kit-51-emails*?
                                 |
                    sim ---------+--------- nao
                     |                       |
                  Worker                  Webflow
                     |                  (site normal)
                     v
   ustoppble.github.io/kit-definitivo/...
```

Um detalhe que importa: o Webflow responde **301 de `www.blackbird.ac` para
`blackbird.ac`**. Como o Worker roda antes do origin, esse redirect não dispara
nesse caminho — por isso o `www` continua funcionando só aqui.

## Setup no painel da Cloudflare

Zona `blackbird.ac` (nameservers `konnor` / `lia.ns.cloudflare.com`).

1. **Workers & Pages** → **Create** → **Create Worker**
2. Nome: `blackbird-kit-51-emails` → **Deploy**
3. **Edit code** → apagar tudo → colar o conteúdo de [`worker.js`](worker.js) → **Deploy**
4. No Worker → **Settings** → **Domains & Routes** → **Add** → **Route**
   - Route: `www.blackbird.ac/kit-51-emails*`
   - Zone: `blackbird.ac`
5. Repetir o passo 4 com `blackbird.ac/kit-51-emails*` — assim quem tirar o `www`
   também chega no lugar certo.

Requisito: `www.blackbird.ac` precisa estar **proxied** (nuvem laranja) no DNS.
Hoje está — resolve pros IPs da Cloudflare (`104.21.6.25`, `172.67.154.151`).

## O que NÃO fazer

- **Não** preencher *Custom domain* em Settings → Pages do repositório. O Pages
  precisa continuar respondendo em `ustoppble.github.io`, que é o origin do
  Worker. Preencher ali quebra o proxy.
- **Não** commitar arquivo `CNAME` no repositório, pelo mesmo motivo.

## Mudando a URL pública

Os dois primeiros valores no topo do `worker.js`:

```js
const PUBLICO = '/kit-51-emails';   // o que o visitante vê
const REPO    = '/kit-definitivo';  // o caminho real no GitHub Pages
```

Trocar `PUBLICO` também exige atualizar o `<link rel="canonical">` e as tags
`og:url` / `og:image` no `index.html`, e o padrão da rota no painel.

## Cache

O Worker guarda as respostas do GitHub por 300s (`cacheTtl`). Depois de publicar
uma alteração no site, ou espera 5 minutos, ou usa **Caching → Purge Cache** na
Cloudflare pra ver na hora.

## Gate de acesso pós-compra

**O problema que isso resolve:** o repo e `obrigado.html` são públicos. Sem
gate, qualquer um que abrisse a página direto (sem comprar) via um link
direto pro Kit e pro diagnóstico gratuito, de graça.

**Como funciona:** o link real do Kit nunca fica no HTML nem no repositório —
mora só como *secret* deste Worker. `obrigado.html` pede o e-mail usado na
compra e chama `/api/verificar-acesso`; o Worker só devolve o link se aquele
e-mail estiver na lista de compradores confirmados. Essa lista é populada
pelo webhook da Eduzz em `/api/eduzz-webhook`, chamado automaticamente
quando uma compra é aprovada.

### 1. Criar o KV Namespace

Painel Cloudflare → **Workers & Pages** → **KV** → **Create a namespace** →
nome `COMPRADORES`.

No Worker `blackbird-kit-51-emails` → **Settings** → **Bindings** → **Add
binding** → **KV Namespace**:
- Variable name: `COMPRADORES`
- KV namespace: o que você acabou de criar

### 2. Criar os secrets

No mesmo Worker → **Settings** → **Variables and Secrets** → **Add** (marcar
como *Encrypted*/*Secret*, não texto puro):

| Nome | Valor |
|---|---|
| `EDUZZ_WEBHOOK_SECRET` | Um token qualquer que **você mesma escolhe** (ex.: uma string aleatória longa) — não vem da Eduzz, você que gera e cola nos dois lugares (aqui e na URL do webhook, passo 3) |
| `LINK_DE_ACESSO` | O link real de acesso ao Kit (Google Drive/Docs) — **nunca** cole isso no HTML |

Pra gerar o token do `EDUZZ_WEBHOOK_SECRET`, qualquer string longa e
aleatória serve — por exemplo, rodando `openssl rand -hex 24` no terminal, ou
um gerador de senha de 40+ caracteres.

### 3. Configurar o webhook na Eduzz

Painel da Eduzz → **Configurações** (ou **Integrações**) → **Webhook** →
adicionar a URL, **já com o token do passo 2 colado na query string**:

```
https://www.blackbird.ac/kit-51-emails/api/eduzz-webhook?secret=SEU_TOKEN_AQUI
```

Marcar as notificações de **compra aprovada/paga** e, se a conta permitir
escolher, **reembolso** / **chargeback** / **cancelamento** — o Worker usa
isso pra revogar o acesso automaticamente dentro da garantia de 7 dias.

A autenticação aqui é pelo token na própria URL (`?secret=...`), não por um
campo dentro do corpo da notificação — isso evita depender de como
exatamente a Eduzz assina o payload, que pode variar por conta ou produto.

**Importante — validar o payload real antes de divulgar a página:** o Worker
tenta reconhecer o e-mail do comprador e o status da compra procurando por
vários nomes de campo comuns (`client_email`, `customer.email`, `status`,
`trans_status_label`, etc. — ver `extrairEmailEduzz()` e `classificarEvento()`
em `worker.js`), porque não dá pra garantir de antemão qual formato exato a
sua conta Eduzz usa. Antes de divulgar a página:
1. Fazer uma compra de teste (ou usar a opção de notificação de teste do
   painel da Eduzz, se o produto tiver).
2. Checar nos **Logs** do Worker (Cloudflare dashboard → **Logs** → **Begin
   log stream**, em tempo real) a linha `[eduzz-webhook] payload recebido:`
   — ela mostra o corpo bruto que a Eduzz mandou.
3. Comparar com o que `extrairEmailEduzz()`/`classificarEvento()` esperam e
   ajustar os nomes de campo em `worker.js` se necessário.

### 4. Testar sem esperar uma compra real

```bash
# simula o webhook de compra aprovada
curl -X POST "https://www.blackbird.ac/kit-51-emails/api/eduzz-webhook?secret=SEU_TOKEN_AQUI" \
  -H "content-type: application/json" \
  -d '{"status":"pago","client_email":"teste@exemplo.com"}'

# confirma que o e-mail agora libera o link
curl -X POST https://www.blackbird.ac/kit-51-emails/api/verificar-acesso \
  -H "content-type: application/json" \
  -d '{"email":"teste@exemplo.com"}'
```

O segundo comando deve devolver `{"ok":true,"kit_url":"..."}`. Um e-mail que
não passou pelo primeiro comando deve devolver `{"ok":false}`.

### O que isso NÃO resolve

- **O link de agendamento do diagnóstico gratuito (TidyCal)** continua sem
  gate — é um link de agenda pública por natureza, gatear ele exigiria lógica
  do lado do TidyCal (campo obrigatório pedindo e-mail da compra + checagem
  manual, ou trocar de ferramenta). Dado o custo baixo de alguém agendar uma
  chamada sem ter comprado, não priorizei isso agora.
- **Repositório público**: deixar o repo privado no GitHub continua
  recomendado — fecha a leitura do código-fonte/histórico direto no GitHub.
  Não é redundante com o gate acima: o gate protege a página *ao vivo*
  (inclusive se alguém achar a URL do GitHub Pages puro), o repo privado
  protege contra quem navega pelo código no github.com.
