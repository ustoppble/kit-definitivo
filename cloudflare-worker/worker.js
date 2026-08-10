/**
 * Funil Kit 51 e-mails — proxy reverso + gate de acesso + upsell.
 *
 * www.blackbird.ac/kit-51-emails  ->  GitHub Pages (ustoppble/kit-51-emails)
 *
 * O site principal (blackbird.ac) roda no Webflow. O GitHub Pages nao consegue
 * servir um sub-caminho de um dominio que ja tem outro site, entao este Worker
 * intercepta as requisicoes do prefixo /kit-51-emails ANTES delas chegarem no
 * Webflow e busca o conteudo no GitHub Pages.
 *
 * O Webflow responde 301 de www.blackbird.ac para blackbird.ac. O Worker roda
 * antes do origin, entao esse redirect nao dispara para este caminho.
 *
 * ── O funil ──
 *   index.html      Kit 51 e-mails, R$17
 *   obrigado.html   destrava o Kit com o e-mail da compra
 *   upsell.html     Active Campaign By Laschuk, R$97 (de R$497)
 *   oto.html        one time offer, so para quem comprou o upsell
 *   diagnostico.html  downsell: quem recusa o upsell cai aqui
 *
 * ── Por que existe gate de acesso ──
 * O repo e as paginas sao publicos. Sem gate, qualquer um abriria obrigado.html
 * e veria o link real do Kit. O link nunca fica no HTML nem no repo — mora como
 * secret deste Worker e so sai depois que o e-mail e confirmado contra a lista
 * de compradores, populada pelo webhook da Eduzz.
 *
 * Bindings necessarios (ver README.md):
 *   KV      COMPRADORES
 *   secret  EDUZZ_WEBHOOK_SECRET   token na URL do webhook
 *   secret  LINK_DE_ACESSO         link real do Kit
 *   secret  SANDBOX_ACESSO         credencial da conta AC sandbox
 *   secret  SESSAO_HMAC            chave que assina o cookie de sessao
 *   secret  AC_ACCOUNT             subdominio da conta ActiveCampaign
 *   secret  AC_API_KEY             token da API do ActiveCampaign
 *   secret  DISCORD_BOT_TOKEN      bot ZERO
 *   secret  DISCORD_ADMIN_USER_ID  destino da DM
 *   secret  DISCORD_CANAL_FALLBACK canal usado se a DM for recusada
 *   secret  CHECKOUT_UPSELL_URL    checkout Eduzz de R$97
 *   secret  CHECKOUT_OTO_URL       checkout Eduzz da OTO
 *   secret  EDUZZ_PRODUTO_UPSELL   identificador do produto upsell na Eduzz
 *   secret  EDUZZ_PRODUTO_OTO      identificador do produto OTO na Eduzz
 */

const ORIGIN = 'https://ustoppble.github.io';

// Caminho publico (o que o visitante ve) e caminho real no GitHub Pages.
const PUBLICO = '/kit-51-emails';
const REPO = '/kit-definitivo';

// Valores de href/src que nunca devem ser reescritos.
const ABSOLUTO = /^(https?:)?\/\/|^[a-z][a-z0-9+.-]*:|^#|^\//i;

// Agendamento do diagnostico. Publico de proposito: e oferta gratuita, nao ha
// nada a proteger, e deixar no codigo evita um secret a mais para gerenciar.
const TIDYCAL_URL = 'https://tidycal.com/team/blackbird/email-scan-diagnostico';

const ORIGENS_PERMITIDAS = new Set([
  'https://www.blackbird.ac',
  'https://blackbird.ac',
  'https://ustoppble.github.io',
]);

// IDs criados via API na conta do Laschuk. Fixos aqui de proposito: buscar a
// tag pelo nome a cada checkout seria uma chamada extra no caminho critico da
// venda, e o nome pode ser editado no painel sem que o ID mude.
const TAGS = {
  novoLead: 1157,
  checkout: 1152,
  recusouUpsell: 1153,
  compraAprovada: 1154,
  otoAprovada: 1155,
  agendouDiagnostico: 1156,
};

const PALAVRAS_APROVADO = ['pago', 'aprovad', 'paid', 'approved', 'completed', 'complete'];
const PALAVRAS_REVOGA = [
  'cancelad', 'cancel', 'reembols', 'estorn', 'refund',
  'chargeback', 'disputa', 'protest', 'contestad',
];

const COOKIE = 'kit51_sess';
const SESSAO_HORAS = 2;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Fora do prefixo: devolve pro Webflow. A rota ja filtra isso, mas se
    // alguem ampliar o padrao no painel o site principal nao quebra.
    if (!url.pathname.startsWith(PUBLICO)) return fetch(request);

    const resto = url.pathname.slice(PUBLICO.length);

    if (resto.startsWith('/api/')) return rotaApi(resto, request, env, ctx);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    return servirEstatico(resto, url, request);
  },
};

async function rotaApi(resto, request, env, ctx) {
  if (request.method === 'OPTIONS') return preflight(request);

  // Webhook e server-to-server: sem CORS, autenticado por token na URL.
  if (resto === '/api/eduzz-webhook') {
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    return webhookEduzz(request, env, ctx);
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: cors(request) });
  }

  switch (resto) {
    case '/api/lead': return novoLead(request, env, ctx);
    case '/api/verificar-acesso': return verificarAcesso(request, env);
    case '/api/upsell-checkout': return upsellCheckout(request, env, ctx);
    case '/api/oto-checkout': return otoCheckout(request, env, ctx);
    case '/api/recusar-upsell': return recusarUpsell(request, env, ctx);
    case '/api/sandbox': return liberarSandbox(request, env);
    case '/api/agendar-diagnostico': return agendarDiagnostico(request, env, ctx);
    default: return json(request, { ok: false, erro: 'rota_desconhecida' }, 404);
  }
}

// ── Estatico ────────────────────────────────────────────────────────────────

async function servirEstatico(resto, url, request) {
  // /kit-51-emails e /kit-51-emails/ servem o index sem redirect, pra que a
  // URL divulgada funcione exatamente como esta escrita, sem barra final.
  const alvo = resto === '' || resto === '/' ? '/index.html' : resto;

  const upstream = await fetch(ORIGIN + REPO + alvo + url.search, {
    method: request.method,
    headers: {
      accept: request.headers.get('accept') || '*/*',
      'accept-language': request.headers.get('accept-language') || '',
      'user-agent': request.headers.get('user-agent') || '',
      // O video e servido por range request quando o usuario arrasta a barra.
      // Sem repassar o Range, o player baixa os 12 MB inteiros a cada seek.
      ...(request.headers.get('range') ? { range: request.headers.get('range') } : {}),
    },
    redirect: 'follow',
    cf: { cacheEverything: true, cacheTtl: 300 },
  });

  const headers = new Headers(upstream.headers);
  headers.delete('content-security-policy');
  headers.set('x-proxied-by', 'blackbird-kit-worker');

  const tipo = headers.get('content-type') || '';
  if (!tipo.includes('text/html')) {
    return new Response(upstream.body, { status: upstream.status, headers });
  }

  // Reescrever o HTML muda o tamanho do corpo, entao os headers que descrevem
  // o corpo original do GitHub passam a mentir. Content-length errado trunca a
  // pagina; etag antigo faz o navegador aceitar um 304 com conteudo velho.
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');

  // O HTML usa caminhos relativos (assets/foo.png, obrigado.html). Sem barra
  // final na URL o navegador resolveria para /assets/foo.png e cairia no
  // Webflow. Reescrever para absoluto resolve isso sem redirect, e mantem as
  // ancoras #... como navegacao interna de verdade.
  const prefixar = (el, attr) => {
    const v = el.getAttribute(attr);
    if (v && !ABSOLUTO.test(v)) el.setAttribute(attr, `${PUBLICO}/${v}`);
  };

  return new HTMLRewriter()
    .on('a[href], link[href]', { element: (el) => prefixar(el, 'href') })
    .on('img[src], script[src], source[src], iframe[src], video[src], video[poster]', {
      element: (el) => {
        prefixar(el, 'src');
        if (el.hasAttribute('poster')) prefixar(el, 'poster');
      },
    })
    .on('img[srcset], source[srcset]', {
      element: (el) => {
        const v = el.getAttribute('srcset');
        if (!v) return;
        el.setAttribute('srcset', v.split(',').map((parte) => {
          const [u, ...desc] = parte.trim().split(/\s+/);
          return [ABSOLUTO.test(u) ? u : `${PUBLICO}/${u}`, ...desc].join(' ');
        }).join(', '));
      },
    })
    .on('form[action]', { element: (el) => prefixar(el, 'action') })
    .transform(new Response(upstream.body, { status: upstream.status, headers }));
}

// ── Sessao ──────────────────────────────────────────────────────────────────
//
// upsell.html precisa saber QUEM esta na pagina para taguear no AC. Passar o
// e-mail em query string criaria um link compartilhavel que qualquer um usaria
// para se taguear como comprador, e vazaria o e-mail no Referer e nos logs.
// Em vez disso, verificar-acesso assina um cookie HttpOnly. Stateless: a
// assinatura carrega a validade, entao nao precisa de KV para sessao.

async function chaveHmac(env) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SESSAO_HMAC || ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function assinarSessao(email, env) {
  const expira = Date.now() + SESSAO_HORAS * 3600 * 1000;
  const corpo = `${email}|${expira}`;
  const mac = await crypto.subtle.sign('HMAC', await chaveHmac(env), new TextEncoder().encode(corpo));
  return `${btoa(corpo).replace(/=+$/, '')}.${b64url(mac)}`;
}

async function lerSessao(request, env) {
  if (!env.SESSAO_HMAC) return null;
  const bruto = request.headers.get('cookie') || '';
  const achado = bruto.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!achado) return null;

  const [corpoB64, macRecebido] = achado.slice(COOKIE.length + 1).split('.');
  if (!corpoB64 || !macRecebido) return null;

  let corpo;
  try { corpo = atob(corpoB64); } catch { return null; }

  const esperado = b64url(
    await crypto.subtle.sign('HMAC', await chaveHmac(env), new TextEncoder().encode(corpo))
  );
  // Comparacao de tamanho fixo: as duas strings tem o mesmo comprimento por
  // construcao (mesmo algoritmo), entao o !== nao vaza posicao do primeiro byte
  // diferente de forma util. O custo de uma comparacao constante aqui nao se
  // paga: o atacante teria que forjar SHA-256 sem a chave.
  if (esperado !== macRecebido) return null;

  const [email, expira] = corpo.split('|');
  if (!email || !expira || Date.now() > Number(expira)) return null;
  return email;
}

function cookieSessao(valor) {
  return `${COOKIE}=${valor}; Path=${PUBLICO}; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSAO_HORAS * 3600}`;
}

// ── ActiveCampaign ──────────────────────────────────────────────────────────

function acTaguear(env, email, tagId) {
  return acContato(env, email, '', '', tagId);
}

// O cadastro traz nome e telefone; os outros pontos do funil so tem o e-mail.
// Campo vazio nao e enviado, para nao apagar o que o contato ja tinha.
async function acContato(env, email, nome, telefone, tagId) {
  if (!env.AC_ACCOUNT || !env.AC_API_KEY) return;
  const base = `https://${env.AC_ACCOUNT}.api-us1.com/api/3`;
  const cab = { 'Api-Token': env.AC_API_KEY, 'Content-Type': 'application/json' };

  const contato = { email };
  if (nome) {
    const partes = nome.split(/\s+/);
    contato.firstName = partes[0];
    if (partes.length > 1) contato.lastName = partes.slice(1).join(' ');
  }
  if (telefone) contato.phone = telefone;

  // contact/sync cria ou atualiza sem precisar saber se o contato ja existe.
  const r = await fetch(`${base}/contact/sync`, {
    method: 'POST', headers: cab, body: JSON.stringify({ contact: contato }),
  });
  if (!r.ok) throw new Error(`AC sync ${r.status}`);
  const id = (await r.json())?.contact?.id;
  if (!id) throw new Error('AC sync sem id');

  const t = await fetch(`${base}/contactTags`, {
    method: 'POST', headers: cab,
    body: JSON.stringify({ contactTag: { contact: id, tag: tagId } }),
  });
  // 422 aqui e "contato ja tem essa tag" — nao e erro pra gente.
  if (!t.ok && t.status !== 422) throw new Error(`AC tag ${t.status}`);
}

// ── Discord ─────────────────────────────────────────────────────────────────

async function notificar(env, texto) {
  if (!env.DISCORD_BOT_TOKEN) return;
  const cab = {
    Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Caminho preferido: DM. So funciona se o admin permitir mensagem direta de
  // membros do servidor — se estiver desligado o Discord responde 50278 e a
  // notificacao cai para o canal, com mencao, para nao se perder.
  if (env.DISCORD_ADMIN_USER_ID) {
    try {
      const c = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST', headers: cab,
        body: JSON.stringify({ recipient_id: env.DISCORD_ADMIN_USER_ID }),
      });
      const canal = (await c.json())?.id;
      if (canal) {
        const m = await fetch(`https://discord.com/api/v10/channels/${canal}/messages`, {
          method: 'POST', headers: cab, body: JSON.stringify({ content: texto }),
        });
        if (m.ok) return;
      }
    } catch { /* cai pro canal abaixo */ }
  }

  if (!env.DISCORD_CANAL_FALLBACK) return;
  const mencao = env.DISCORD_ADMIN_USER_ID ? `<@${env.DISCORD_ADMIN_USER_ID}> ` : '';
  await fetch(`https://discord.com/api/v10/channels/${env.DISCORD_CANAL_FALLBACK}/messages`, {
    method: 'POST', headers: cab, body: JSON.stringify({ content: mencao + texto }),
  });
}

// Tag e aviso sao acessorios: a venda nao pode cair porque o AC ou o Discord
// esta fora do ar. Por isso vao em waitUntil e os erros so viram log.
function emSegundoPlano(ctx, env, email, tagId, texto) {
  ctx.waitUntil((async () => {
    const r = await Promise.allSettled([
      tagId ? acTaguear(env, email, tagId) : Promise.resolve(),
      notificar(env, texto),
    ]);
    r.forEach((x, i) => {
      if (x.status === 'rejected') console.log(`[funil] ${i ? 'discord' : 'ac'} falhou:`, String(x.reason));
    });
  })());
}

// ── Rotas ───────────────────────────────────────────────────────────────────

// Cadastro na pagina de conversao — dispara antes de o visitante ir pro
// checkout, entao e o unico ponto em que a gente fica sabendo de quem nao
// comprou. Rota publica de proposito: quem preenche o formulario ainda nao tem
// sessao nenhuma.
async function novoLead(request, env, ctx) {
  const origin = request.headers.get('origin') || '';
  // Sem sessao para autenticar, a origem e a unica barreira barata contra
  // alguem despejar lixo no ActiveCampaign e no Discord a partir de fora.
  if (origin && !ORIGENS_PERMITIDAS.has(origin)) {
    return json(request, { ok: false, erro: 'origem_nao_permitida' }, 403);
  }

  let body;
  try { body = await request.json(); } catch {
    return json(request, { ok: false, erro: 'requisicao_invalida' }, 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const nome = String(body.nome || '').trim().slice(0, 120);
  const telefone = String(body.telefone || '').trim().slice(0, 40);
  if (!email.includes('@') || email.length > 160) {
    return json(request, { ok: false, erro: 'email_invalido' }, 400);
  }

  // Quem recarrega a pagina e preenche de novo nao pode gerar dois avisos. A
  // tag continua sendo reaplicada (o AC ignora duplicata), so o alerta cala.
  const repetido = Boolean(await env.COMPRADORES.get(`lead:${email}`));
  if (!repetido) await env.COMPRADORES.put(`lead:${email}`, '1', { expirationTtl: 86400 });

  ctx.waitUntil((async () => {
    const tarefas = [acContato(env, email, nome, telefone, TAGS.novoLead)];
    if (!repetido) {
      tarefas.push(notificar(env,
        `🆕 **[KIT51] novo cadastro**\n\`${email}\`` +
        (nome ? `\nnome: ${nome}` : '') +
        (telefone ? `\ntelefone: ${telefone}` : '')));
    }
    const r = await Promise.allSettled(tarefas);
    r.forEach((x) => { if (x.status === 'rejected') console.log('[lead] falhou:', String(x.reason)); });
  })());

  return json(request, { ok: true }, 200);
}

async function verificarAcesso(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return json(request, { ok: false, erro: 'requisicao_invalida' }, 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email) return json(request, { ok: false, erro: 'email_vazio' }, 400);

  if (!(await env.COMPRADORES.get(email))) return json(request, { ok: false }, 200);

  const extra = { 'set-cookie': cookieSessao(await assinarSessao(email, env)) };

  // Quem ja comprou o upsell nao pode ver a oferta de novo — iria pagar duas
  // vezes pelo mesmo acesso. Esse vai direto para o Kit.
  const jaComprouUpsell = Boolean(await env.COMPRADORES.get(`sandbox:${email}`));

  return json(request, {
    ok: true,
    kit_url: env.LINK_DE_ACESSO,
    upsell_url: jaComprouUpsell ? null : `${PUBLICO}/upsell.html`,
  }, 200, extra);
}

async function upsellCheckout(request, env, ctx) {
  const email = await lerSessao(request, env);
  if (!email) return json(request, { ok: false, erro: 'sessao_invalida' }, 401);

  emSegundoPlano(ctx, env, email, TAGS.checkout,
    `🟡 **[KIT51] checkout do upsell** (R$97)\n\`${email}\``);

  return json(request, { ok: true, url: env.CHECKOUT_UPSELL_URL || '' }, 200);
}

async function otoCheckout(request, env, ctx) {
  const email = await lerSessao(request, env);
  if (!email) return json(request, { ok: false, erro: 'sessao_invalida' }, 401);

  emSegundoPlano(ctx, env, email, null,
    `🟠 **[KIT51] checkout da OTO** (R$297)\n\`${email}\``);

  return json(request, { ok: true, url: env.CHECKOUT_OTO_URL || '' }, 200);
}

async function recusarUpsell(request, env, ctx) {
  const email = await lerSessao(request, env);
  if (!email) return json(request, { ok: false, erro: 'sessao_invalida' }, 401);

  emSegundoPlano(ctx, env, email, TAGS.recusouUpsell,
    `⚪ **[KIT51] recusou o upsell** — foi pro diagnostico\n\`${email}\``);

  return json(request, { ok: true, url: `${PUBLICO}/diagnostico.html` }, 200);
}

async function agendarDiagnostico(request, env, ctx) {
  const email = await lerSessao(request, env);
  // Sem sessao ainda vale agendar: o link do TidyCal e publico e a oferta e
  // gratuita. So nao da pra taguear quem nao sabemos quem e.
  if (email) {
    emSegundoPlano(ctx, env, email, TAGS.agendouDiagnostico,
      `🔵 **[KIT51] foi agendar o diagnostico**\n\`${email}\``);
  }
  return json(request, { ok: true, url: TIDYCAL_URL }, 200);
}

async function liberarSandbox(request, env) {
  const email = await lerSessao(request, env);
  if (!email) return json(request, { ok: false, erro: 'sessao_invalida' }, 401);

  if (!(await env.COMPRADORES.get(`sandbox:${email}`))) {
    return json(request, { ok: false }, 200);
  }
  return json(request, { ok: true, acesso: env.SANDBOX_ACESSO || '' }, 200);
}

// ── Webhook ─────────────────────────────────────────────────────────────────

async function webhookEduzz(request, env, ctx) {
  const url = new URL(request.url);
  if (!env.EDUZZ_WEBHOOK_SECRET || url.searchParams.get('secret') !== env.EDUZZ_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const bruto = await request.text();
  let body = {};
  try { body = JSON.parse(bruto); } catch { body = Object.fromEntries(new URLSearchParams(bruto)); }

  // Loga o payload cru pra conferir nos Logs do Worker no primeiro webhook
  // real e ajustar extrairEmail/classificarEvento/qualProduto se precisar.
  console.log('[eduzz-webhook] payload:', bruto.slice(0, 2000));

  const email = extrairEmail(body);
  const evento = classificarEvento(body);
  const produto = qualProduto(body, env);

  if (evento === 'revoga') {
    if (email) {
      await env.COMPRADORES.delete(email);
      await env.COMPRADORES.delete(`sandbox:${email}`);
    }
    return new Response('OK', { status: 200 });
  }
  if (evento !== 'aprova') return new Response('Ignored', { status: 200 });
  if (!email) return new Response('No email', { status: 400 });

  // Sem TTL: quem compra tem acesso permanente (o produto e download, nao
  // assinatura). Revogacao acontece so via reembolso/chargeback acima.
  if (produto === 'upsell') {
    await env.COMPRADORES.put(`sandbox:${email}`, '1');
    emSegundoPlano(ctx, env, email, TAGS.compraAprovada,
      `🟢 **[KIT51] COMPROU o upsell** (R$97) — sandbox liberada\n\`${email}\``);
  } else if (produto === 'oto') {
    await env.COMPRADORES.put(`oto:${email}`, '1');
    emSegundoPlano(ctx, env, email, TAGS.otoAprovada,
      `🟢 **[KIT51] COMPROU a OTO**\n\`${email}\``);
  } else {
    // Produto desconhecido cai aqui e libera SO o Kit. E de proposito: enquanto
    // os identificadores da Eduzz nao estiverem configurados, o pior caso e o
    // comprador do Kit nao ganhar a sandbox — nunca o contrario.
    await env.COMPRADORES.put(email, '1');
  }

  return new Response('OK', { status: 200 });
}

function extrairEmail(body) {
  const c = [
    body?.client_email, body?.email, body?.customer?.email, body?.buyer?.email,
    body?.data?.customer?.email, body?.data?.client?.email, body?.data?.buyer?.email,
  ];
  const achado = c.find((v) => typeof v === 'string' && v.includes('@'));
  return achado ? achado.trim().toLowerCase() : '';
}

function classificarEvento(body) {
  const texto = [
    body?.trans_status_label, body?.trans_status, body?.status,
    body?.event, body?.action, body?.resource, body?.data?.status,
  ].filter((v) => v !== undefined && v !== null).map((v) => String(v).toLowerCase()).join(' | ');

  if (PALAVRAS_REVOGA.some((p) => texto.includes(p))) return 'revoga';
  if (PALAVRAS_APROVADO.some((p) => texto.includes(p))) return 'aprova';
  return 'ignora';
}

// Com tres produtos na mesma conta Eduzz, o webhook precisa distinguir qual
// foi comprado — senao a compra do Kit de R$17 liberaria a sandbox de R$97.
function qualProduto(body, env) {
  const texto = [
    body?.product_cod, body?.product_id, body?.product_name,
    body?.data?.product?.id, body?.data?.product?.name, body?.data?.product_id,
  ].filter((v) => v !== undefined && v !== null).map((v) => String(v).toLowerCase()).join(' | ');

  const bate = (cfg) => cfg && String(cfg).toLowerCase().split(',')
    .map((s) => s.trim()).filter(Boolean).some((s) => texto.includes(s));

  if (bate(env.EDUZZ_PRODUTO_UPSELL)) return 'upsell';
  if (bate(env.EDUZZ_PRODUTO_OTO)) return 'oto';
  return 'kit';
}

// ── CORS ────────────────────────────────────────────────────────────────────

function cors(request) {
  const origin = request.headers.get('origin') || '';
  const h = new Headers();
  if (ORIGENS_PERMITIDAS.has(origin)) {
    h.set('access-control-allow-origin', origin);
    h.set('access-control-allow-credentials', 'true');
    h.set('vary', 'origin');
  }
  h.set('access-control-allow-methods', 'POST, OPTIONS');
  h.set('access-control-allow-headers', 'content-type');
  return h;
}

function preflight(request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

function json(request, obj, status, extra) {
  const h = cors(request);
  h.set('content-type', 'application/json');
  if (extra) for (const [k, v] of Object.entries(extra)) h.append(k, v);
  return new Response(JSON.stringify(obj), { status, headers: h });
}
