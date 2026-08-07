/**
 * Proxy reverso: www.blackbird.ac/kit-51-emails  ->  GitHub Pages
 * + gate de acesso pos-compra (obrigado.html so libera o link real
 *   pra quem tem e-mail confirmado como comprador pela Eduzz).
 *
 * O site principal (blackbird.ac) roda no Webflow. O GitHub Pages nao consegue
 * servir um sub-caminho de um dominio que ja tem outro site, entao este Worker
 * intercepta as requisicoes do prefixo /kit-51-emails ANTES delas chegarem no
 * Webflow e busca o conteudo no GitHub Pages.
 *
 * Detalhe importante: o Webflow responde 301 de www.blackbird.ac para
 * blackbird.ac. O Worker roda antes do origin, entao esse redirect nao dispara
 * para este caminho — o /kit-51-emails continua funcionando no www.
 *
 * Rota configurada no painel: www.blackbird.ac/kit-51-emails*
 *
 * ── Por que o gate de acesso existe ──
 * O repo (e a pagina obrigado.html) sao publicos. Sem isso, qualquer um que
 * abrisse obrigado.html direto (sem comprar) veria o link real do Kit e o
 * link do diagnostico gratuito. O link real nunca fica no HTML/repo — ele
 * mora só como secret deste Worker (LINK_DE_ACESSO) e so e devolvido depois
 * que /api/verificar-acesso confirma o e-mail contra a lista de compradores
 * (populada pelo webhook da Eduzz em /api/eduzz-webhook).
 *
 * Bindings necessarios neste Worker (ver README.md):
 *   - KV Namespace "COMPRADORES"          (Settings -> Bindings -> KV Namespace)
 *   - Secret "EDUZZ_WEBHOOK_SECRET"       (token que voce escolhe e cola na URL do webhook, ver README.md)
 *   - Secret "LINK_DE_ACESSO"             (o link real do Kit, Drive/Docs)
 */

const ORIGIN = 'https://ustoppble.github.io';

// Caminho publico (o que o visitante ve) e caminho real no GitHub Pages.
// Se um dia o repo for renomeado, so este par muda.
const PUBLICO = '/kit-51-emails';
const REPO = '/kit-51-emails';

// Valores de href/src que nunca devem ser reescritos.
const ABSOLUTO = /^(https?:)?\/\/|^[a-z][a-z0-9+.-]*:|^#|^\//i;

// Origens que podem chamar /api/verificar-acesso via fetch do navegador.
// Inclui o dominio proprio E o github.io cru, porque alguem pode cair na
// pagina do GitHub Pages direto (sem passar por este Worker) e o botao de
// acesso da obrigado.html precisa continuar funcionando mesmo assim.
const ORIGENS_PERMITIDAS = new Set([
  'https://www.blackbird.ac',
  'https://blackbird.ac',
  'https://ustoppble.github.io',
]);

// Palavras usadas pra classificar o evento da Eduzz como aprovacao ou
// revogacao de acesso. A Eduzz ja teve mais de um formato de webhook
// (notificacao classica com "trans_status"/"trans_status_label", e a API
// mais nova baseada em eventos tipo "invoice.paid"), entao em vez de travar
// num nome de campo so, isso varre os campos mais prováveis (status, evento,
// label) procurando por essas palavras. Ajuste depois de ver um payload real
// (ver README.md, secao "Validar o payload real").
const PALAVRAS_APROVADO = ['pago', 'aprovad', 'paid', 'approved', 'completed', 'complete'];
const PALAVRAS_REVOGA = [
  'cancelad', 'cancel', 'reembols', 'estorn', 'refund',
  'chargeback', 'disputa', 'protest', 'contestad',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Fora do prefixo: devolve pro Webflow. A rota ja filtra isso, mas se
    // alguem ampliar o padrao da rota no painel o site principal nao quebra.
    if (!url.pathname.startsWith(PUBLICO)) return fetch(request);

    const resto = url.pathname.slice(PUBLICO.length);

    // ── API: webhook da Eduzz (server-to-server, sem CORS) ──
    if (resto === '/api/eduzz-webhook') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return handleWebhook(request, env);
    }

    // ── API: verificacao de e-mail chamada pelo navegador ──
    if (resto === '/api/verificar-acesso') {
      if (request.method === 'OPTIONS') return handleCorsPreflight(request);
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders(request.headers.get('origin') || '') });
      }
      return handleVerificar(request, env);
    }

    // Metodos de escrita nao fazem sentido pro resto do site estatico.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // /kit-51-emails e /kit-51-emails/ servem o index sem redirect, pra que a
    // URL divulgada funcione exatamente como esta escrita, sem barra final.
    const alvo = resto === '' || resto === '/' ? '/index.html' : resto;

    const upstream = await fetch(ORIGIN + REPO + alvo + url.search, {
      method: request.method,
      headers: {
        accept: request.headers.get('accept') || '*/*',
        'accept-language': request.headers.get('accept-language') || '',
        'user-agent': request.headers.get('user-agent') || '',
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
    // Webflow. Reescrever para absoluto resolve isso sem precisar de redirect,
    // e mantem as ancoras #... como navegacao interna de verdade.
    const prefixar = (el, attr) => {
      const v = el.getAttribute(attr);
      if (v && !ABSOLUTO.test(v)) el.setAttribute(attr, `${PUBLICO}/${v}`);
    };

    const rewritten = new HTMLRewriter()
      .on('a[href], link[href]', { element: (el) => prefixar(el, 'href') })
      .on('img[src], script[src], source[src], iframe[src]', {
        element: (el) => prefixar(el, 'src'),
      })
      .on('img[srcset], source[srcset]', {
        element: (el) => {
          const v = el.getAttribute('srcset');
          if (!v) return;
          el.setAttribute(
            'srcset',
            v
              .split(',')
              .map((parte) => {
                const [u, ...desc] = parte.trim().split(/\s+/);
                const novo = ABSOLUTO.test(u) ? u : `${PUBLICO}/${u}`;
                return [novo, ...desc].join(' ');
              })
              .join(', ')
          );
        },
      })
      .on('form[action]', { element: (el) => prefixar(el, 'action') })
      .transform(new Response(upstream.body, { status: upstream.status, headers }));

    return rewritten;
  },
};

async function handleWebhook(request, env) {
  // Autenticacao por token na propria URL do webhook, em vez de um campo
  // dentro do corpo — assim nao depende de adivinhar como a Eduzz assina a
  // notificacao. Configure a URL na Eduzz como:
  //   https://www.blackbird.ac/kit-51-emails/api/eduzz-webhook?secret=SEU_TOKEN
  const url = new URL(request.url);
  const secretRecebido = url.searchParams.get('secret') || '';
  if (!env.EDUZZ_WEBHOOK_SECRET || secretRecebido !== env.EDUZZ_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const bruto = await request.text();
  let body = {};
  try {
    body = JSON.parse(bruto);
  } catch {
    // A Eduzz pode mandar form-urlencoded em vez de JSON, dependendo do
    // formato de notificacao configurado.
    body = Object.fromEntries(new URLSearchParams(bruto));
  }

  // Loga o payload cru pra dar pra conferir nos Logs do Worker (Cloudflare
  // dashboard -> Logs -> Begin log stream) no primeiro teste real e ajustar
  // os campos em extrairEmailEduzz/classificarEvento se precisar.
  console.log('[eduzz-webhook] payload recebido:', bruto.slice(0, 2000));

  const classificacao = classificarEvento(body);
  const email = extrairEmailEduzz(body);

  if (classificacao === 'revoga') {
    if (email) await env.COMPRADORES.delete(email);
    return new Response('OK', { status: 200 });
  }

  if (classificacao !== 'aprova') {
    return new Response('Ignored', { status: 200 });
  }
  if (!email) return new Response('No email', { status: 400 });

  // Sem TTL: quem compra tem acesso permanente (o produto e um download,
  // nao uma assinatura). Revogacao acontece so via reembolso/chargeback acima.
  await env.COMPRADORES.put(email, '1');
  return new Response('OK', { status: 200 });
}

function extrairEmailEduzz(body) {
  const candidatos = [
    body?.client_email,
    body?.email,
    body?.customer?.email,
    body?.buyer?.email,
    body?.data?.customer?.email,
    body?.data?.client?.email,
    body?.data?.buyer?.email,
  ];
  const achado = candidatos.find((v) => typeof v === 'string' && v.includes('@'));
  return achado ? achado.trim().toLowerCase() : '';
}

function classificarEvento(body) {
  const candidatos = [
    body?.trans_status_label,
    body?.trans_status,
    body?.status,
    body?.event,
    body?.action,
    body?.resource,
    body?.data?.status,
  ];
  const texto = candidatos
    .filter((v) => v !== undefined && v !== null)
    .map((v) => String(v).toLowerCase())
    .join(' | ');

  if (PALAVRAS_REVOGA.some((p) => texto.includes(p))) return 'revoga';
  if (PALAVRAS_APROVADO.some((p) => texto.includes(p))) return 'aprova';
  return 'ignora';
}

async function handleVerificar(request, env) {
  const origin = request.headers.get('origin') || '';

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(origin, { ok: false, erro: 'requisicao_invalida' }, 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email) return jsonResponse(origin, { ok: false, erro: 'email_vazio' }, 400);

  const encontrado = await env.COMPRADORES.get(email);
  if (!encontrado) return jsonResponse(origin, { ok: false }, 200);

  return jsonResponse(origin, { ok: true, kit_url: env.LINK_DE_ACESSO }, 200);
}

function corsHeaders(origin) {
  const headers = new Headers();
  if (ORIGENS_PERMITIDAS.has(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'origin');
  }
  headers.set('access-control-allow-methods', 'POST, OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  return headers;
}

function handleCorsPreflight(request) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

function jsonResponse(origin, obj, status) {
  const headers = corsHeaders(origin);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(obj), { status, headers });
}
