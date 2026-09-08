import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Build a review-only, offline artifact. Production files remain untouched.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const app=read('c/app.js');
const viewStart=app.indexOf('  // A leitura da amostra');
const viewEnd=app.indexOf('  // Preservado da variante B');
if(viewStart<0 || viewEnd<=viewStart) throw new Error('Bloco de interação não encontrado');
const interaction=app.slice(viewStart,viewEnd);
let html=read('c/index.html')
  .replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/,'')
  .replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/,'')
  .replace(/<link rel="canonical"[^>]+>/,'')
  .replace('<link rel="stylesheet" href="/kit-51-emails/c/style.css">','<style>'+read('c/style.css')+'</style>')
  .replace('<script src="/kit-51-emails/c/app.js" defer></script>','<script>document.addEventListener("DOMContentLoaded",function(){'+interaction+'});</script>')
  .replace(/\s+srcset="[^"]+"/g,'')
  .replace(/(<a\b[^>]*\bhref=")[^"]+("[^>]*>)/g,(all,before,after)=>before+(all.includes('data-checkout')?'#oferta':all.includes('class="skip"')?'#conteudo':'#aviso-previa')+after)
  .replace('<title>','<title>Prévia local — ')
  .replace('<head>','<head>\n<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; connect-src \'none\'; base-uri \'none\'; form-action \'none\'">')
  .replace('<body>','<body>\n<aside id="aviso-previa" style="padding:8px 16px;background:#e9effa;color:#18376f;text-align:center;font:12px/1.4 Arial,sans-serif">Prévia local · sem pagamento ou tracking. Os botões apenas mostram a oferta.</aside>');
const mime={'.webp':'image/webp','.svg':'image/svg+xml'};
html=html.replace(/((?:src|href)=")\/kit-51-emails\/([^\"]+)(")/g,(all,start,relative,end)=>{
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep) || !mime[path.extname(file)])throw new Error('Recurso inesperado na prévia');
  return start+'data:'+mime[path.extname(file)]+';base64,'+fs.readFileSync(file).toString('base64')+end;
});
if(/\bfetch\s*\(|dataLayer|https?:\/\//.test(html))throw new Error('A prévia ainda contém integração de rede');
fs.writeFileSync(path.join(root,'docs/c/PREVIA.html'),html);
console.log('Prévia autocontida criada em docs/c/PREVIA.html.');
