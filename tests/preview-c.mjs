import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=path.join(root,'docs/c/PREVIA.html');
assert.ok(fs.existsSync(entry),'A prévia autocontida precisa existir');
const {chromium}=await import(process.env.K51E_PLAYWRIGHT || 'playwright');
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const external=[];
  page.on('request',r=>{if(!['file:','data:'].includes(new URL(r.url()).protocol))external.push(true);});
  await page.goto(pathToFileURL(entry).href);
  assert.match(await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily),/Arial/);
  for(const img of await page.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
  assert.ok(await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.naturalWidth>0)));
  await page.getByRole('button',{name:'Ver adaptação'}).click();
  assert.ok(await page.locator('#sample-adapted').isVisible());
  await page.locator('#hero-cta').click();
  assert.equal(new URL(page.url()).protocol,'file:');
  assert.equal(new URL(page.url()).hash,'#oferta');
  assert.equal(await page.evaluate(()=>typeof window.dataLayer),'undefined');
  assert.equal(external.length,0);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:path.join(root,'docs/c/qa/preview-390.png')});
  console.log('Prévia local: estilo, imagens, interação, CTA seguro e zero rede externa verificados.');
} finally {await browser.close();}
