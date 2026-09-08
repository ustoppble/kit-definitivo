import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Exercises the real page in an isolated browser. Every network request is
// intercepted: QA never submits a lead, sends telemetry, or makes a purchase.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs/c/qa');
const results = [];
function check(ok, message) { assert.ok(ok, message); results.push(message); }
const oldPage = fs.readFileSync(path.join(root, 'b/index.html'), 'utf8');
const canonical = oldPage.match(/rel="canonical" href="([^"]+)"/)[1];
const checkout = oldPage.match(/checkoutUrl:\s*'([^']+)'/)[1];
const origin = new URL(canonical).origin;
const prefix = new URL(canonical).pathname.replace(/\/$/, '');
const entry = path.join(root, 'c/index.html');

try {
  check(fs.existsSync(entry), 'A variante C existe para ser renderizada');
  const html = fs.readFileSync(entry,'utf8');
  const gtm = oldPage.match(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/)[0];
  const noscript = oldPage.match(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/)[0];
  check(html.includes(gtm) && html.includes(noscript), 'Loader e noscript do GTM idênticos à variante B');
  const { chromium } = await import(process.env.K51E_PLAYWRIGHT || 'playwright');
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(output, {recursive: true});
  const errors = [];
  const missing = [];
  const checkoutRequests = [];
  const apiRequests = [];
  const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript', '.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
  try {
    for (const width of [390, 1440, 320, 768]) {
      const height = width === 1440 ? 960 : 844;
      const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
      await context.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin === new URL(checkout).origin) {
          checkoutRequests.push(request.url());
          return route.fulfill({contentType:'text/html',body:'<h1>Destino de compra interceptado pelo teste</h1>'});
        }
        if (url.origin !== origin) return route.fulfill({contentType:'application/javascript',body:''});
        if (url.pathname.startsWith(prefix + '/api/')) {
          apiRequests.push({path:url.pathname,body:request.postData()});
          return route.fulfill({contentType:'application/json',body:'{}'});
        }
        let relative = url.pathname.startsWith(prefix + '/') ? url.pathname.slice(prefix.length+1) : url.pathname.slice(1);
        if (relative.endsWith('/')) relative += 'index.html';
        let file = path.resolve(root, relative);
        if (file.startsWith(root + path.sep) && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          missing.push(relative);
          return route.fulfill({status:404,body:'Recurso ausente no teste'});
        }
        return route.fulfill({contentType:mime[path.extname(file)] || 'application/octet-stream',body:fs.readFileSync(file)});
      });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.name));
      await page.goto(origin + prefix + '/c/?utm_source=qa&utm_campaign=variant-c', {waitUntil:'networkidle'});
      const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth);
      check(!overflow, `Sem overflow horizontal em ${width}px`);
      check(await page.locator('h1').count() === 1, `Uma headline principal em ${width}px`);
      check(await page.locator('form').count() === 0, `Compra sem formulário intermediário em ${width}px`);
      // Visit lazy assets before checking decoding, then restore the first fold.
      for (const img of await page.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el=>el.decode());
      }
      await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      check(await page.locator('img').evaluateAll(images=>images.every(img=>img.complete && img.naturalWidth>0 && img.hasAttribute('alt') && img.getAttribute('alt').trim())), `Imagens carregadas com alt em ${width}px`);
      const links = await page.locator('a[data-checkout]').evaluateAll(nodes=>nodes.map(n=>n.href));
      check(links.length >= 3 && links.every(href=>href===checkout), `Todos os CTAs preservam o checkout e cupom em ${width}px`);
      const ancillaryLinks = await page.locator('a:not([data-checkout])').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
      for (const href of ancillaryLinks) {
        if (href.startsWith('#')) check(await page.locator(href).count()===1, `Âncora ${href} tem destino único em ${width}px`);
        else {
          const url = new URL(href, origin);
          const local = path.resolve(root,url.pathname.slice(prefix.length+1));
          check(url.origin===origin && url.pathname.startsWith(prefix+'/') && local.startsWith(root+path.sep) && fs.existsSync(local), `Link legal local tem destino existente em ${width}px`);
        }
      }
      const text = await page.locator('main').innerText();
      check(!/(?:%FIRSTNAME%|\[(?:PRODUTO|F6\w+|NOME)\]|(?:51|52|37)\s+(?:e-?mails|modelos)|69%|103%|50%|2x|milh[oõ]es|encerra hoje|últimas vagas)/i.test(text), `Copy sem placeholders, contagens conflitantes ou claims bloqueados em ${width}px`);
      if (width===390) {
        const priceAccessibility = await page.locator('.price').ariaSnapshot();
        check(priceAccessibility.replace(/\s+/g,'').includes('paragraph:R$17,00'), 'Preço principal expõe R$17,00 como texto acessível nativo');
      }
      check(await page.evaluate(()=>window.dataLayer.filter(e=>e.event==='ViewContent').length)===1, `ViewContent único em ${width}px`);
      check(await page.evaluate(()=>window.dataLayer.filter(e=>e.event==='InitiateCheckout').length)===0, `Abrir a página não registra início de checkout em ${width}px`);
      if (width===390 || width===1440) {
        const contrast = await page.evaluate(() => {
          const rgb = color => (color.match(/[\d.]+/g)||[]).map(Number);
          const luminance = values => values.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0);
          const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
          let node; let minimum = Infinity; let count = 0; const failures=[];
          while ((node=walker.nextNode())) {
            const el=node.parentElement;
            if (!node.textContent.trim() || !el || el.closest('[aria-hidden="true"],script,style,noscript') || !el.getClientRects().length || getComputedStyle(el).visibility==='hidden') continue;
            const style=getComputedStyle(el); const fg=rgb(style.color);
            let background=[255,255,255]; let parent=el;
            while(parent) {
              const value=rgb(getComputedStyle(parent).backgroundColor);
              if(value.length===3 || value[3]===1) {background=value;break;}
              parent=parent.parentElement;
            }
            const light=luminance(fg); const dark=luminance(background);
            const ratio=(Math.max(light,dark)+.05)/(Math.min(light,dark)+.05);
            const large=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && parseFloat(style.fontWeight)>=700);
            minimum=Math.min(minimum,ratio); count++;
            if(ratio<(large?3:4.5)) failures.push({element:el.tagName,class:el.className,ratio:Number(ratio.toFixed(2))});
          }
          return {count,minimum:Number(minimum.toFixed(2)),failures};
        });
        check(contrast.count>50 && contrast.failures.length===0, `Contraste de texto atende 4,5:1 normal / 3:1 grande em ${width}px (mínimo observado ${contrast.minimum}:1)`);
        const hero = await page.locator('.hero-product').boundingBox();
        const cta = await page.locator('#hero-cta').boundingBox();
        check(hero && hero.y + hero.height <= height, `Produto visível na primeira dobra em ${width}px`);
        check(cta && cta.y + cta.height <= height, `CTA visível na primeira dobra em ${width}px`);
        if (width===390) {
          const detailsInline = await page.locator('.hero-details > span').evaluateAll(items => items.length===3 && items.every(item => {
            const tick = item.querySelector(':scope > .tick');
            const text = [...item.childNodes].find(node=>node.nodeType===Node.TEXT_NODE && node.textContent.trim());
            if (!tick || !text) return false;
            const range = document.createRange();
            range.selectNodeContents(text);
            const tickBox = tick.getBoundingClientRect();
            const textBox = range.getBoundingClientRect();
            const gap = textBox.left - tickBox.right;
            const overlap = Math.min(tickBox.bottom,textBox.bottom) - Math.max(tickBox.top,textBox.top);
            return tickBox.width<=24 && gap>=0 && gap<=16 && overlap>0;
          }));
          check(detailsInline, 'Ícones precedem os textos dos benefícios sem espaço artificial em 390px');
        }
        await page.screenshot({path:path.join(output,`hero-${width}.png`)});
        await page.screenshot({path:path.join(output,`page-${width}.png`),fullPage:true});
      }
      await page.getByRole('button',{name:'Ver adaptação'}).click();
      check(await page.locator('#sample-adapted').isVisible(), `A demonstração revela a adaptação em ${width}px`);
      check(!(await page.locator('#sample-original').isVisible()), `A demonstração substitui o trecho original em ${width}px`);
      check(await page.evaluate(()=>window.dataLayer.filter(e=>e.event==='InitiateCheckout').length)===0, `A demonstração não dispara compra em ${width}px`);
      if (width===1440) await page.locator('.document-demo').screenshot({path:path.join(output,'sample-adapted.png')});
      await page.getByRole('button',{name:'Ver trecho do Kit'}).click();
      if (width===1440) await page.locator('.document-demo').screenshot({path:path.join(output,'sample-original.png')});
      await page.getByText('Preciso saber automação?', {exact:true}).click();
      check(await page.locator('#faq-automation').evaluate(el=>el.open), `FAQ abre em ${width}px`);
      await page.locator('#sequencias').scrollIntoViewIfNeeded();
      if (width===390) {
        await page.locator('.sticky-cta').waitFor({state:'visible'});
        check(await page.locator('.sticky-cta').isVisible(), 'CTA móvel aparece depois do hero');
        await page.screenshot({path:path.join(output,'sequences-390.png')});
        await page.locator('#demonstracao').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,'demo-390.png')});
        await page.locator('.bonuses').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,'bonuses-390.png')});
        await page.locator('.offer-card').scrollIntoViewIfNeeded();
        await page.locator('.sticky-cta').waitFor({state:'hidden'});
        check(!(await page.locator('.sticky-cta').isVisible()), 'CTA móvel não sobrepõe o bloco de oferta');
        await page.screenshot({path:path.join(output,'offer-390.png')});
        await page.locator('#final-cta').scrollIntoViewIfNeeded();
        check(!(await page.locator('.sticky-cta').isVisible()), 'CTA móvel não duplica o CTA final visível');
      }
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.locator('#hero-cta').focus();
      // Exercise keyboard modality, not programmatic focus after a mouse click.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      const focus = await page.locator('#hero-cta').evaluate(el=>({active:document.activeElement===el,outline:getComputedStyle(el).outlineStyle}));
      check(focus.active && focus.outline!=='none', `Foco de teclado visível em ${width}px`);
      await page.keyboard.press('Enter');
      await page.waitForURL(url=>url.origin===new URL(checkout).origin);
      check(checkoutRequests.at(-1)===checkout, `Teclado chega ao checkout vigente em ${width}px`);
      // The navigation is real; capture the event before leaving in a second page.
      await page.goto(origin + prefix + '/c/',{waitUntil:'networkidle'});
      await page.locator('#hero-cta').evaluate(el=>el.addEventListener('click',e=>e.preventDefault(),{once:true}));
      await page.locator('#hero-cta').click();
      const event = await page.evaluate(()=>window.dataLayer.filter(e=>e.event==='InitiateCheckout'));
      check(event.length===1 && event[0].variante==='C' && event[0].metodo==='direto' && event[0].value===17 && event[0].currency==='BRL', `InitiateCheckout correto e único por clique em ${width}px`);
      if (width===390) {
        await page.evaluate(()=>document.documentElement.style.fontSize='200%');
        check(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)), 'Texto ampliado a 200% sem overflow horizontal');
        await page.goto(origin + prefix + '/c',{waitUntil:'networkidle'});
        check(await page.locator('.hero-product img').evaluate(img=>img.complete && img.naturalWidth>0) && await page.locator('#hero-cta').getAttribute('href')===checkout, 'Hero e CTA funcionam no caminho sem barra final');
      }
      await context.close();
    }
    const nojs = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await nojs.route('**/*',route=>route.abort());
    // Serve a self-contained static document and preserve actual hrefs with JS off.
    const page = await nojs.newPage();
    await page.setContent(fs.readFileSync(entry,'utf8'));
    check(await page.locator('a[data-checkout]').evaluateAll((nodes,want)=>nodes.every(n=>n.getAttribute('href')===want),checkout), 'Links de compra funcionam sem JavaScript');
    await nojs.close();
    check(errors.length===0, 'Nenhum erro de JavaScript');
    check(missing.length===0, 'Nenhum recurso local ausente');
    check(apiRequests.length>0 && apiRequests.every(r=>r.path===prefix+'/api/visita'), 'Somente a visita existente é emitida; nenhum lead é criado');
    const baselinePath = process.env.K51E_BASELINE || path.join(output,'baseline-sha256.json');
    if (baselinePath) {
      const baseline = JSON.parse(fs.readFileSync(baselinePath,'utf8'));
      check(Object.entries(baseline).every(([file,hash])=>fs.existsSync(path.join(root,file)) && crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')===hash), 'Todos os arquivos rastreados preexistentes permanecem idênticos');
    }
    const report = {status:'passed',checks:results.length,results,viewports:[390,1440,320,768],network:'isolated; no external requests or purchases',generatedAt:new Date().toISOString()};
    fs.writeFileSync(path.join(output,'results.json'), JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
} catch(error) {
  console.error('QA FAIL: '+String(error.message).replace(/https?:\/\/\S+/g,'***'));
  process.exitCode=1;
}
