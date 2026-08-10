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
 *   oto.html        Active Campaign By Laschuk, R$97 (de R$497)
 *   diagnostico.html  quem COMPROU o AC: destrava o Kit e agenda o diagnostico
 *   obrigado.html   quem RECUSOU: destrava o Kit e agenda o diagnostico
 *
 * As duas ultimas fazem a mesma coisa e terminam no mesmo lugar (TidyCal). Sao
 * duas paginas porque a copy muda: quem comprou tem Kit + AC e precisa ativar
 * os dois; quem recusou tem so o Kit e precisa saber por onde comecar.
 *
 * "upsell" nao aparece em nome de arquivo de proposito: o nome fica visivel na
 * barra de enderecos do comprador.
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
 *   secret  SANDBOX_ACESSO         o que o comprador do upsell recebe: o link de
 *                                  compartilhamento que instala as automacoes na
 *                                  conta dele. (O nome do secret e historico — a
 *                                  entrega deixou de ser acesso a uma sandbox.)
 *   secret  SESSAO_HMAC            chave que assina o cookie de sessao
 *   secret  AC_ACCOUNT             subdominio da conta ActiveCampaign
 *   secret  AC_API_KEY             token da API do ActiveCampaign
 *   secret  DISCORD_BOT_TOKEN      bot Maverick
 *   secret  DISCORD_ADMIN_USER_ID  so para mencionar no canal (@voce)
 *   secret  DISCORD_CANAL_ALERTAS  canal privado que recebe TODOS os alertas
 *   secret  CHECKOUT_UPSELL_URL    checkout Eduzz de R$97
 *   secret  EDUZZ_PRODUTO_UPSELL   identificador do produto upsell na Eduzz
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

// Checkout do upsell (Active Campaign By Laschuk). Mesma logica do TIDYCAL_URL:
// link de checkout e publico por natureza — qualquer comprador ve a URL na barra
// de enderecos —, entao guardar em secret so criava mais um item pendente pra
// pagina entrar no ar. O secret CHECKOUT_UPSELL_URL continua valendo como
// override, caso o link mude sem deploy.
//
// O ?cupom=OTO NAO e opcional: o preco cadastrado do produto e R$497 e o cupom
// e o que leva a R$97, que e o valor anunciado na oto.html. Sem ele o comprador
// e cobrado cinco vezes o prometido.
//
// urlCheckoutUpsell() acrescenta nome/e-mail/telefone a esta base. Testado no
// checkout do Kit: cupom + dados do comprador funciona; o que quebra e somar
// skip=1 a isso — ver o comentario em irParaCheckout, no index.html.
const CHECKOUT_UPSELL = 'https://chk.eduzz.com/8017V3XQ07?cupom=OTO';

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
  // O TidyCal nao manda webhook de agendamento, entao a unica forma de saber
  // que alguem marcou o diagnostico e perguntar. O Cron pergunta de 5 em 5
  // minutos e avisa so o que e novo.
  //
  // /api/agendar-diagnostico avisa que a pessoa CLICOU em agendar; isso aqui
  // avisa que ela realmente marcou. Sao coisas diferentes e as duas importam:
  // a distancia entre uma e outra e o quanto a agenda esta espantando gente.
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(verificarAgendamentos(env));
  },

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
    case '/api/visita': return registrarVisita(request, env, ctx);
    case '/api/lead': return novoLead(request, env, ctx);
    case '/api/verificar-acesso': return verificarAcesso(request, env);
    case '/api/upsell-checkout': return upsellCheckout(request, env, ctx);
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
// oto.html precisa saber QUEM esta na pagina para taguear no AC. Passar o
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

// Destino unico: o canal privado configurado em DISCORD_CANAL_ALERTAS.
//
// A versao anterior tentava DM primeiro e so caia pro canal se a DM falhasse.
// Isso espalhava alerta em dois lugares dependendo da configuracao de
// privacidade do Discord — exatamente o que nao se quer. Agora e um destino so,
// explicito: se o canal nao estiver configurado, nao manda nada, em vez de
// procurar outro lugar para entregar.
async function notificar(env, texto) {
  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_CANAL_ALERTAS) return;

  // Sem mencao: o canal e privado e dedicado a isso, entao quem precisa ver ja
  // esta nele. allowed_mentions vazio garante que nenhum texto vindo de fora
  // (nome digitado no formulario, por exemplo) consiga pingar ninguem.
  const r = await fetch(
    `https://discord.com/api/v10/channels/${env.DISCORD_CANAL_ALERTAS}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: texto, allowed_mentions: { parse: [] } }),
    }
  );
  if (!r.ok) throw new Error(`discord ${r.status}`);
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

// Nomes amigaveis das paginas, para o alerta nao dizer "/oto.html".
const PAGINAS = {
  '/': 'pagina de vendas (Kit R$17)',
  '/index.html': 'pagina de vendas (Kit R$17)',
  '/oto.html': 'oferta do AC By Laschuk (R$97)',
  '/diagnostico.html': 'entrega — comprou o AC',
  '/obrigado.html': 'entrega — recusou o AC',
};

// Visita de pagina. Um aviso por visitante por pagina a cada 6h — sem isso, uma
// landing com trafego de anuncio entope o canal em minutos e o Discord comeca a
// limitar o bot, fazendo a gente perder os avisos que importam (venda).
async function registrarVisita(request, env, ctx) {
  const origin = request.headers.get('origin') || '';
  if (origin && !ORIGENS_PERMITIDAS.has(origin)) {
    return json(request, { ok: false }, 403);
  }

  let body = {};
  try { body = await request.json(); } catch { /* segue com pagina desconhecida */ }

  const caminho = String(body.pagina || '').slice(0, 60);
  const nome = PAGINAS[caminho] || caminho || 'pagina desconhecida';

  // Identidade aproximada do visitante: IP + navegador. Nao da para contar
  // pessoa de verdade sem cookie, e cookie aqui seria consentimento a pedir por
  // uma metrica que serve so para avisar. Aproximado resolve.
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ua = request.headers.get('user-agent') || '';
  const bruto = new TextEncoder().encode(`${ip}|${ua}|${caminho}`);
  const digest = await crypto.subtle.digest('SHA-256', bruto);
  const chave = `visita:${b64url(digest).slice(0, 24)}`;

  if (!(await env.COMPRADORES.get(chave))) {
    await env.COMPRADORES.put(chave, '1', { expirationTtl: 6 * 3600 });
    const pais = request.cf?.country ? ` · ${request.cf.country}` : '';
    ctx.waitUntil(
      notificar(env, `👀 **[KIT51] visita** — ${nome}${pais}`)
        .catch((e) => console.log('[visita] discord falhou:', String(e)))
    );
  }

  return json(request, { ok: true }, 200);
}

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

  // Guardado so pra pre-preencher o checkout do upsell mais tarde: la o Worker
  // conhece o comprador pela sessao assinada, que carrega apenas o e-mail.
  // TTL de 30 dias porque quem paga o Kit no boleto pode levar dias pra chegar
  // na oferta — depois disso o dado se apaga sozinho.
  if (nome || telefone) {
    await env.COMPRADORES.put(`dados:${email}`, JSON.stringify({ nome, telefone }),
      { expirationTtl: 60 * 60 * 24 * 30 });
  }

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
    upsell_url: jaComprouUpsell ? null : `${PUBLICO}/oto.html`,
  }, 200, extra);
}

async function upsellCheckout(request, env, ctx) {
  const email = await lerSessao(request, env);
  if (!email) return json(request, { ok: false, erro: 'sessao_invalida' }, 401);

  emSegundoPlano(ctx, env, email, TAGS.checkout,
    `🟡 **[KIT51] checkout do upsell** (R$97)\n\`${email}\``);

  return json(request, { ok: true, url: await urlCheckoutUpsell(email, env) }, 200);
}

// Leva nome, e-mail e telefone pro checkout do upsell, pra pessoa nao redigitar
// o que ja preencheu na landing. Os dados vem do KV, gravados em /api/lead.
//
// NUNCA acrescentar skip=1 aqui. Com dados do comprador na URL, ele faz a Eduzz
// recusar o cupom — e sem cupom o produto volta a custar R$497. O caso esta
// documentado em irParaCheckout, no index.html.
async function urlCheckoutUpsell(email, env) {
  const base = env.CHECKOUT_UPSELL_URL || CHECKOUT_UPSELL;
  try {
    const u = new URL(base);
    u.searchParams.set('email', email);

    const bruto = await env.COMPRADORES.get(`dados:${email}`);
    if (bruto) {
      const d = JSON.parse(bruto);
      if (d.nome) u.searchParams.set('nome', d.nome);
      // Mesma normalizacao do index.html: a Eduzz espera DDD + numero, sem o
      // codigo do pais.
      const digitos = String(d.telefone || '').replace(/\D/g, '');
      const cel = digitos.length > 11 ? digitos.slice(-11) : digitos;
      if (cel) u.searchParams.set('cel', cel);
    }
    return u.toString();
  } catch (e) {
    // Preenchimento e conveniencia; cobrar nao e. Qualquer falha aqui devolve o
    // link base, que ja tem o cupom e vende do mesmo jeito.
    console.log('[upsell] pre-preenchimento falhou:', String(e));
    return base;
  }
}

async function recusarUpsell(request, env, ctx) {
  const email = await lerSessao(request, env);
  if (!email) return json(request, { ok: false, erro: 'sessao_invalida' }, 401);

  emSegundoPlano(ctx, env, email, TAGS.recusouUpsell,
    `⚪ **[KIT51] recusou a oferta do AC** — foi pra entrega\n\`${email}\``);

  // Quem recusa vai pra obrigado.html. Quem compra vai pra diagnostico.html, e
  // quem manda pra la e o redirect da Eduzz, nao o Worker.
  return json(request, { ok: true, url: `${PUBLICO}/obrigado.html` }, 200);
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

  // Origem da chamada no aviso: o secret do webhook e curto e ja circulou, e a
  // decisao foi mantê-lo. Isso nao impede uma compra forjada, mas faz ela se
  // denunciar — toda compra legitima vem sempre da mesma origem, entao uma que
  // venha de outro lugar salta aos olhos no canal.
  const origem = `${request.headers.get('cf-connecting-ip') || '?'}${request.cf?.country ? ' · ' + request.cf.country : ''}`;

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
  } else {
    // Produto desconhecido cai aqui e libera SO o Kit. E de proposito: enquanto
    // os identificadores da Eduzz nao estiverem configurados, o pior caso e o
    // comprador do Kit nao ganhar a sandbox — nunca o contrario.
    await env.COMPRADORES.put(email, '1');
    emSegundoPlano(ctx, env, email, null,
      `💰 **[KIT51] COMPROU o Kit** (R$17)\n\`${email}\`\norigem: ${origem}`);
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

// Com dois produtos na mesma conta Eduzz, o webhook precisa distinguir qual foi
// comprado — senao a compra do Kit de R$17 liberaria a entrega do AC de R$97.
function qualProduto(body, env) {
  const texto = [
    body?.product_cod, body?.product_id, body?.product_name,
    body?.data?.product?.id, body?.data?.product?.name, body?.data?.product_id,
  ].filter((v) => v !== undefined && v !== null).map((v) => String(v).toLowerCase()).join(' | ');

  const bate = (cfg) => cfg && String(cfg).toLowerCase().split(',')
    .map((s) => s.trim()).filter(Boolean).some((s) => texto.includes(s));

  if (bate(env.EDUZZ_PRODUTO_UPSELL)) return 'upsell';
  return 'kit';
}

// ── TidyCal ─────────────────────────────────────────────────────────────────

// O TidyCal so expoe a agenda por MCP — a API REST recusa este token. MCP exige
// duas viagens: initialize devolve o mcp-session-id, e so entao da pra chamar
// uma ferramenta.
async function tidycalBookings(env) {
  const cab = {
    Authorization: `Bearer ${env.TIDYCAL_TOKEN}`,
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  };
  const ini = await fetch('https://tidycal.com/mcp', {
    method: 'POST', headers: cab,
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: {
        protocolVersion: '2024-11-05', capabilities: {},
        clientInfo: { name: 'kit51-worker', version: '1' },
      },
    }),
  });
  const sessao = ini.headers.get('mcp-session-id');
  if (!sessao) throw new Error('tidycal sem sessao');

  const r = await fetch('https://tidycal.com/mcp', {
    method: 'POST', headers: { ...cab, 'mcp-session-id': sessao },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'list-bookings', arguments: {} },
    }),
  });

  // A resposta vem como SSE: linhas "data: {json}".
  const bruto = await r.text();
  for (const linha of bruto.split('\n')) {
    const corpo = linha.replace(/^data:\s*/, '').trim();
    if (!corpo.startsWith('{')) continue;
    const d = JSON.parse(corpo);
    if (!d.result) continue;
    const txt = (d.result.content || []).map((c) => c.text || '').join('');
    const dados = JSON.parse(txt);
    return Array.isArray(dados) ? dados : (dados.data || dados.bookings || []);
  }
  return [];
}

async function verificarAgendamentos(env) {
  if (!env.TIDYCAL_TOKEN) return;

  let bookings;
  try { bookings = await tidycalBookings(env); }
  catch (e) { console.log('[tidycal] falhou:', String(e)); return; }

  // Primeira execucao: registra tudo que ja existe sem avisar, senao o canal
  // levaria uma enxurrada com o historico inteiro da agenda.
  const jaRodou = await env.COMPRADORES.get('tidycal:iniciado');

  for (const b of bookings) {
    const id = String(b.id || '');
    if (!id) continue;
    const chave = `tidycal:${id}`;
    if (await env.COMPRADORES.get(chave)) continue;
    await env.COMPRADORES.put(chave, '1');
    if (!jaRodou) continue;

    const contato = b.contact || {};
    const quando = String(b.starts_at || '').replace('T', ' ').slice(0, 16);
    await notificar(env,
      `📅 **[KIT51] AGENDOU o diagnostico**\n` +
      `\`${contato.email || 'sem e-mail'}\`` +
      (contato.name ? `\nnome: ${contato.name}` : '') +
      (quando ? `\nquando: ${quando} UTC` : '')
    ).catch((e) => console.log('[tidycal] discord falhou:', String(e)));

    if (contato.email) {
      await acTaguear(env, String(contato.email).toLowerCase(), TAGS.agendouDiagnostico)
        .catch((e) => console.log('[tidycal] ac falhou:', String(e)));
    }
  }

  if (!jaRodou) await env.COMPRADORES.put('tidycal:iniciado', '1');
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
