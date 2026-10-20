// Genera Concepto-Agrotrade.pdf y Concepto-Casacake.pdf a partir de las maquetas.
// Uso: npm install && node generar.cjs
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const DIR = __dirname;
const SHOTS = path.join(DIR, 'capturas');
const FONTS = path.join(DIR, 'node_modules', '@fontsource');
fs.mkdirSync(SHOTS, { recursive: true });

function fontFaces(list) {
  return list.map(([pkg, family, weights]) => weights.map(w => {
    const file = path.join(FONTS, pkg, 'files', `${pkg}-latin-${w}-normal.woff2`);
    if (!fs.existsSync(file)) throw new Error('Falta fuente: ' + file);
    return `@font-face{font-family:"${family}";font-weight:${w};font-style:normal;src:url("file://${file}") format("woff2")}`;
  }).join('\n')).join('\n');
}

const BRANDS = {
  agrotrade: {
    file: 'Concepto-Agrotrade.pdf',
    mock: path.join(DIR, '..', 'agrotrade', 'index.html'),
    artifact: 'https://claude.ai/artifact/8mVXx41rrPghdcDH69Z5eq',
    fonts: [['big-shoulders-display', 'Big Shoulders Display', [600, 800, 900]],
            ['public-sans', 'Public Sans', [400, 500, 600, 700]],
            ['ibm-plex-mono', 'IBM Plex Mono', [400, 500]]],
    shots: {
      desktop: [['home', null], ['tienda', '#tienda'], ['como', '#como-comprar'], ['volumen', '#volumen'], ['hero-art', '#pile']],
      mobile: ['home', 'tienda', 'cart', 'datos', 'volumen']
    }
  },
  casacake: {
    file: 'Concepto-Casacake.pdf',
    mock: path.join(DIR, '..', 'casacake', 'index.html'),
    artifact: 'https://claude.ai/artifact/5EeHrUWxm3QSBQLQBGN6He',
    fonts: [['bricolage-grotesque', 'Bricolage Grotesque', [500, 700, 800]],
            ['figtree', 'Figtree', [400, 500, 600, 700]],
            ['dm-mono', 'DM Mono', [400, 500]]],
    shots: {
      desktop: [['home', null], ['tienda', '#tienda'], ['calculadora', '#calculadora'], ['empresas', '#empresas'], ['ideas', '#ideas'], ['hero-art', '#hero-art']],
      mobile: ['home', 'tienda', 'cart', 'datos', 'calculadora']
    }
  }
};

/* ---------- capturas de las maquetas ---------- */
async function capture(browser, key, b) {
  const css = fontFaces(b.fonts) + '\n#mock{display:none!important}.toast{display:none!important}';
  const url = 'file://' + b.mock;
  const out = n => path.join(SHOTS, `${key}-${n}.jpg`);

  const d = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
  await d.goto(url); await d.addStyleTag({ content: css }); await d.evaluate(() => document.fonts.ready);
  for (const [name, sel] of b.shots.desktop) {
    if (!sel) { await d.screenshot({ path: out(name), type: 'jpeg', quality: 84 }); continue; }
    await d.addStyleTag({ content: '.top{position:static!important}.wa{display:none!important}' });
    await d.locator(sel).screenshot({ path: out(name), type: 'jpeg', quality: 84 });
  }
  await d.close();

  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', isMobile: true, hasTouch: true });
  await m.goto(url); await m.addStyleTag({ content: css }); await m.evaluate(() => document.fonts.ready);
  const shot = n => m.screenshot({ path: out('m-' + n), type: 'jpeg', quality: 84 });
  const scrollTo = async sel => { await m.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 66); }, sel); await m.waitForTimeout(150); };
  for (const n of b.shots.mobile) {
    if (n === 'home') { await shot(n); }
    else if (n === 'cart') { await m.locator('[data-add]').first().click(); await m.click('#open-cart'); await m.waitForTimeout(200); await shot(n); }
    else if (n === 'datos') { await m.click('[data-go="datos"]'); await m.waitForTimeout(150); await shot(n); await m.keyboard.press('Escape'); }
    else { await scrollTo(n === 'tienda' ? '#grid' : '#' + n); await shot(n); }
  }
  await m.close();
}

/* ---------- piezas comunes del documento ---------- */
const PEND = t => `<span class="pend">${t || 'Pendiente'}</span>`;
const img = (key, n) => `file://${path.join(SHOTS, `${key}-${n}.jpg`)}`;
const browserShot = (key, n, url, h) => `<figure class="browser"><div class="bar"><i></i><i></i><i></i><span>${url}</span></div><div class="vp" style="max-height:${h}mm"><img src="${img(key, n)}" alt=""></div></figure>`;
const phone = (key, n, cap) => `<figure class="phone-wrap"><div class="phone"><img src="${img(key, 'm-' + n)}" alt=""></div>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;

function page(b, i, total, section, body, cls = '') {
  return `<section class="page ${cls}">
    <header class="ph"><span class="mark">${b.mark}</span><span class="sec">${section}</span><span class="num">${String(i).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></header>
    <div class="pb">${body}</div>
    <footer class="pf"><span>Concepto de sitio web y tienda en línea · ${b.domain}</span><span>Octubre 2026 · Borrador para revisión</span></footer>
  </section>`;
}

const BASE_CSS = `
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font:10.5pt/1.5 var(--f-body);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;page-break-after:always;break-after:page;padding:12mm 16mm 0;display:flex;flex-direction:column;background:var(--bg)}
.page:last-child{page-break-after:auto;break-after:auto}
.ph{display:flex;align-items:baseline;gap:8mm;font:500 7.5pt/1 var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-bottom:4mm;border-bottom:.3mm solid var(--line)}
.ph .mark{color:var(--ink);font:var(--mark-font);letter-spacing:var(--mark-ls);text-transform:var(--mark-tt)}
.ph .sec{margin-right:auto}
.pb{flex:1;padding-top:8mm;min-height:0;display:flex;flex-direction:column}
.pf{display:flex;justify-content:space-between;font:400 7pt/1 var(--f-mono);color:var(--muted);padding:4mm 0 7mm;border-top:.3mm solid var(--line)}
h1,h2,h3{font-family:var(--f-display);margin:0;line-height:1;text-wrap:balance}
h2{font-size:var(--h2);font-weight:800;text-transform:var(--tt);letter-spacing:var(--h-ls);max-width:220mm}
h3{font-size:var(--h3);font-weight:800;text-transform:var(--tt);letter-spacing:var(--h-ls)}
p{margin:0}
.eyebrow{font:500 7.5pt/1.2 var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent-text)}
.lede{font-size:12pt;color:var(--muted);max-width:150mm;margin-top:4mm}
.muted{color:var(--muted)}
.pend{display:inline-block;font:500 7pt/1.3 var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--pend);border:.35mm dashed var(--pend);background:var(--pend-bg);border-radius:1mm;padding:.4mm 1.6mm;white-space:nowrap;vertical-align:.3mm}
.cols{display:grid;gap:10mm;align-items:start}
.c2{grid-template-columns:1fr 1fr}.c3{grid-template-columns:repeat(3,1fr)}.c-shot{grid-template-columns:78mm 1fr}
.stack{display:flex;flex-direction:column;gap:4mm}
.list{list-style:none;margin:0;padding:0;display:grid;gap:2.6mm}
.list li{display:grid;grid-template-columns:3mm 1fr;gap:2.5mm;align-items:baseline}
.list li::before{content:"";width:2.2mm;height:2.2mm;background:var(--accent);border-radius:var(--dot-r);transform:translateY(-.2mm)}
.list b{font-weight:600}
.box{border:.3mm solid var(--line);border-radius:var(--r);padding:5mm;background:var(--surface)}
.box h3{font-size:13pt;margin-bottom:3mm}
table{width:100%;border-collapse:collapse;font-size:9.5pt}
th{font:500 7pt/1.2 var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-align:left;padding:2.2mm 2.5mm;border-bottom:.4mm solid var(--ink)}
td{padding:2.4mm 2.5mm;border-bottom:.3mm solid var(--line);vertical-align:top}
td.n,th.n{text-align:right;font-family:var(--f-mono);font-variant-numeric:tabular-nums;white-space:nowrap}
.browser{margin:0;border:.3mm solid var(--line);border-radius:2.5mm;overflow:hidden;background:var(--surface);box-shadow:0 2mm 6mm rgb(0 0 0 / .08)}
.browser .bar{height:6.5mm;display:flex;align-items:center;gap:1.4mm;padding:0 3mm;background:var(--bar);border-bottom:.3mm solid var(--line)}
.browser .bar i{width:2mm;height:2mm;border-radius:50%;background:var(--line)}
.browser .bar span{margin-left:3mm;font:400 7pt/1 var(--f-mono);color:var(--muted)}
.browser .vp{overflow:hidden}
.browser img{width:100%;display:block}
.phone-wrap{margin:0;display:grid;gap:3mm;justify-items:center}
.phone{width:56mm;border:1.8mm solid #1a1a1a;border-radius:7mm;overflow:hidden;background:#1a1a1a;box-shadow:0 2mm 6mm rgb(0 0 0 / .15)}
.phone img{width:100%;display:block;border-radius:5mm}
.phone-wrap figcaption{font:400 7.5pt/1.3 var(--f-mono);color:var(--muted);text-align:center;max-width:56mm}
.sm .phone{width:40mm;border-width:1.4mm;border-radius:5mm}.sm .phone img{border-radius:3.6mm}.sm figcaption{max-width:40mm}
.phones{display:flex;justify-content:space-between;gap:6mm;align-items:flex-start}
.swatches{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.sw{border:.3mm solid var(--line);border-radius:var(--r);overflow:hidden;background:var(--surface)}
.sw div{height:18mm}
.sw p{padding:2mm 3mm;font-size:8.5pt;line-height:1.3}
.sw small{display:block;font:400 7pt/1.3 var(--f-mono);color:var(--muted)}
.type{display:grid;gap:4mm}
.type .t{border-top:.3mm solid var(--line);padding-top:3mm;display:grid;grid-template-columns:30mm 1fr;gap:4mm;align-items:baseline}
.type .t small{font:400 7pt/1.3 var(--f-mono);color:var(--muted)}
.steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(5,1fr);gap:0;counter-reset:s}
.steps li{counter-increment:s;border-top:.6mm solid var(--ink);padding:3mm 4mm 0 0;display:grid;gap:1.5mm;align-content:start;font-size:9pt}
.steps li::before{content:counter(s,decimal-leading-zero);font:800 18pt/1 var(--f-display);color:var(--accent-text)}
.steps b{font-size:10pt}
.map{display:grid;gap:5mm}
.node{border:.35mm solid var(--ink);border-radius:var(--r);padding:3mm 4mm;background:var(--surface);font-size:9pt;line-height:1.35}
.node b{display:block;font:800 11pt/1.1 var(--f-display);text-transform:var(--tt);letter-spacing:var(--h-ls);margin-bottom:1mm}
.node.root{background:var(--ink);color:var(--bg);text-align:center;justify-self:center;min-width:70mm}
.node.alt{border-style:dashed}
.map-row{display:grid;gap:3mm}
.map-line{height:5mm;border-left:.35mm solid var(--ink);justify-self:center}
.note{font-size:8.5pt;color:var(--muted)}
.kpi{display:grid;gap:1mm}
.kpi strong{font:800 20pt/1 var(--f-display);text-transform:var(--tt)}
.mt{margin-top:5mm}.mt2{margin-top:8mm}
`;

/* ---------- AGROTRADE ---------- */
function agrotrade(key, b) {
  b.mark = 'Agrotrade'; b.domain = 'agrotrade.cl';
  const css = `
:root{--bg:#F3F4EE;--surface:#FFFFFF;--ink:#17201A;--muted:#5A665C;--line:#D8DCD0;--bar:#ECEEE6;
--field:#1F3B28;--straw:#E0A100;--accent:#E0A100;--accent-text:#8A6300;--kraft:#CDAE7E;--rust:#A4472C;
--pend:#A9581A;--pend-bg:#FBF0E4;--r:1.6mm;--dot-r:0;
--f-display:"Big Shoulders Display","Arial Narrow",sans-serif;--f-body:"Public Sans",Arial,sans-serif;--f-mono:"IBM Plex Mono",monospace;
--h2:30pt;--h3:16pt;--tt:uppercase;--h-ls:.01em;--mark-font:900 11pt/1 "Big Shoulders Display";--mark-ls:.06em;--mark-tt:uppercase}
.cover{background:var(--field);color:#F3F4EE;padding:0}
.cover .in{display:grid;grid-template-columns:1.15fr .85fr;height:100%;}
.cover .l{padding:16mm 0 14mm 18mm;display:flex;flex-direction:column}
.cover .brand{font:900 64pt/0.9 var(--f-display);text-transform:uppercase;letter-spacing:.01em}
.cover .brand i{font-style:normal;color:var(--straw)}
.cover .eyebrow{color:#B9C7BB}
.cover h1{font:800 30pt/1 var(--f-display);text-transform:uppercase;margin-top:auto;max-width:150mm}
.cover h1 em{font-style:normal;color:var(--straw)}
.cover p{color:#B9C7BB;max-width:120mm;margin-top:5mm;font-size:11pt}
.cover .meta{margin-top:10mm;display:flex;gap:10mm;font:400 8pt/1.4 var(--f-mono);color:#B9C7BB}
.cover .meta b{display:block;color:#F3F4EE;font-weight:500}
.cover .r{display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.cover .r img{width:118%;max-width:none;display:block;margin-bottom:-2mm}
.dark{background:var(--field);color:#F3F4EE}
.dark .ph,.dark .pf{border-color:rgb(243 244 238 / .15);color:#9FB0A3}.dark .ph .mark{color:#F3F4EE}
.dark .muted,.dark .lede{color:#B9C7BB}.dark .eyebrow{color:var(--straw)}
`;
  const P = [];
  const total = 12;
  P.push(`<section class="page cover"><div class="in">
    <div class="l">
      <p class="eyebrow">Concepto de sitio web y tienda en línea</p>
      <div class="brand" style="margin-top:6mm">Agro<i>trade</i></div>
      <h1>Granos y forrajes <em>de origen</em>, por saco o por camión</h1>
      <p>Propuesta para renovar agrotrade.cl: una tienda clara para comprar por saco y un canal directo para pedidos por volumen.</p>
      <div class="meta"><span><b>Fecha</b>Octubre 2026</span><span><b>Estado</b>Borrador para revisión</span><span><b>Maqueta interactiva</b>${b.artifact.replace('https://', '')}</span></div>
    </div>
    <div class="r"><img src="${img(key, 'hero-art')}" alt=""></div>
  </div></section>`);

  P.push(page(b, 2, total, 'Punto de partida', `
    <p class="eyebrow">Diagnóstico</p><h2>Qué tiene hoy agrotrade.cl</h2>
    <div class="cols c2 mt2">
      <div class="box"><h3>Lo que funciona</h3><ul class="list">
        <li><span>Tienda con productos de nutrición animal bajo la línea <b>Productos de Origen</b>.</span></li>
        <li><span>Fichas con condiciones claras: <b>compra mínima</b>, flete no incluido, entrega coordinada por WhatsApp.</span></li>
        <li><span>Pago al contado por transferencia antes de la entrega y retiro en Rancagua.</span></li>
        <li><span>Correo de contacto propio: rinostroza@agrotrade.cl.</span></li>
      </ul></div>
      <div class="box"><h3>Lo que hay que corregir</h3><ul class="list">
        <li><span>La ficha de harina de soya usa la dirección <b>/producto/hoodie-with-logo/</b>, un resto de la plantilla de WooCommerce.</span></li>
        <li><span>Las fichas dicen <b>IV Región</b>; Rancagua está en la VI Región de O'Higgins.</span></li>
        <li><span>Las fichas aparecen publicadas hace unos 3 años y 9 meses, sin actualizar.</span></li>
        <li><span>El pellet de girasol aparece como relacionado, pero sin ficha propia.</span></li>
        <li><span>No hay un canal para pedidos grandes (camión completo, contratos mensuales).</span></li>
        <li><span>Precios por saco: no pudimos verificarlos. ${PEND()}</span></li>
      </ul></div>
    </div>`));

  P.push(page(b, 3, total, 'Objetivo y público', `
    <p class="eyebrow">Objetivo</p><h2>Vender por saco en línea y captar pedidos por volumen</h2>
    <p class="lede">El sitio tiene dos trabajos: que un productor arme su pedido en minutos desde el celular, y que un comprador grande pueda pedir una cotización sin llamar.</p>
    <div class="cols c3 mt2">
      <div class="box"><h3>Lecherías y ganaderos</h3><p class="muted">Compran avena forrajera y concentrados de forma recurrente. Necesitan precio claro, mínimo de compra y despacho al predio.</p></div>
      <div class="box"><h3>Productores por saco</h3><p class="muted">Compran de 5 a 20 sacos y retiran en Rancagua. Necesitan saber qué hay, cuánto cuesta y cómo pagar.</p></div>
      <div class="box"><h3>Compras por volumen</h3><p class="muted">Camión completo o abastecimiento por temporada. Necesitan cotizar con flete incluido y condiciones por frecuencia.</p></div>
    </div>
    <div class="box mt"><p><b>Mensaje principal:</b> «Granos y forrajes de origen, por saco o por camión».</p></div>`));

  P.push(page(b, 4, total, 'Identidad visual', `
    <p class="eyebrow">Identidad</p><h2>El rótulo del saco como idea visual</h2>
    <div class="cols c2 mt">
      <div class="stack">
        <p class="muted">Verde de campo, paja y papel kraft. Los productos se muestran como sacos rotulados, con su nombre y peso, hasta tener fotos reales. Los datos técnicos (kilos, proteína, mínimos) van en tipografía monoespaciada, como en una ficha.</p>
        <div class="swatches">
          <div class="sw"><div style="background:#1F3B28"></div><p>Verde campo<small>#1F3B28</small></p></div>
          <div class="sw"><div style="background:#E0A100"></div><p>Paja<small>#E0A100</small></p></div>
          <div class="sw"><div style="background:#CDAE7E"></div><p>Kraft<small>#CDAE7E</small></p></div>
          <div class="sw"><div style="background:#A4472C"></div><p>Óxido<small>#A4472C</small></p></div>
          <div class="sw"><div style="background:#F3F4EE"></div><p>Tiza<small>#F3F4EE</small></p></div>
          <div class="sw"><div style="background:#17201A"></div><p>Tinta<small>#17201A</small></p></div>
        </div>
        <p class="note">Logo: mantener el actual o rediseñar. ${PEND()}</p>
      </div>
      <div class="type">
        <div class="t"><small>Títulos<br>Big Shoulders Display</small><span style="font:900 30pt/1 var(--f-display);text-transform:uppercase">Avena forrajera</span></div>
        <div class="t"><small>Texto<br>Public Sans</small><span style="font-size:11pt">Forraje de alta calidad y fácil manejo. En lecherías permite reducir el uso de concentrados.</span></div>
        <div class="t"><small>Datos<br>IBM Plex Mono</small><span style="font:400 10pt/1.5 var(--f-mono)">Compra mínima 20 sacos · 500 kg</span></div>
        <div class="t"><small>Tono</small><span>Directo y práctico, como se habla en el campo. Sin adornos: qué es, cuánto pesa, cuánto cuesta y cómo llega.</span></div>
      </div>
    </div>`));

  P.push(page(b, 5, total, 'Estructura del sitio', `
    <p class="eyebrow">Mapa del sitio</p><h2>Una página, todo a mano</h2>
    <p class="lede">Una sola página de inicio con secciones, un carro siempre visible y un botón de WhatsApp fijo.</p>
    <div class="map mt2">
      <div class="node root"><b>Inicio</b>Portada con propuesta y accesos directos</div>
      <div class="map-line"></div>
      <div class="map-row" style="grid-template-columns:repeat(6,1fr)">
        <div class="node"><b>Tienda</b>Productos con filtro por categoría</div>
        <div class="node"><b>Cómo comprar</b>Los 5 pasos, del carro a la bodega</div>
        <div class="node"><b>Volumen</b>Formulario de cotización</div>
        <div class="node"><b>Nosotros</b>Historia de la familia ${PEND()}</div>
        <div class="node"><b>Preguntas</b>Flete, mínimos, pago y retiro</div>
        <div class="node"><b>Contacto</b>Correo, WhatsApp ${PEND()}</div>
      </div>
      <div class="map-row mt" style="grid-template-columns:1fr 1fr 1fr">
        <div class="node alt"><b>Carro</b>Sacos, peso total en kg y total en pesos</div>
        <div class="node alt"><b>Datos y entrega</b>Retiro en Rancagua o despacho a predio</div>
        <div class="node alt"><b>Confirmación</b>Resumen del pedido para WhatsApp y correo</div>
      </div>
    </div>`));

  P.push(page(b, 6, total, 'Página de inicio', `
    <div class="cols c-shot">
      <div class="stack">
        <p class="eyebrow">Portada</p><h2 style="font-size:26pt">Lo primero que se ve</h2>
        <ul class="list mt">
          <li><span><b>Titular con la propuesta:</b> qué venden y en qué formatos.</span></li>
          <li><span><b>Dos caminos:</b> ver productos o cotizar volumen.</span></li>
          <li><span><b>Franja de condiciones:</b> compra mínima, retiro, pago y coordinación por WhatsApp.</span></li>
          <li><span><b>Carro en la cabecera</b>, con el número de sacos.</span></li>
        </ul>
      </div>
      ${browserShot(key, 'home', 'agrotrade.cl', 150)}
    </div>`));

  P.push(page(b, 7, total, 'Tienda', `
    <div class="cols" style="grid-template-columns:1fr 1.05fr">
      <div class="stack">
        <p class="eyebrow">Catálogo</p><h2 style="font-size:26pt">Productos actuales</h2>
        <table class="mt"><thead><tr><th>Producto</th><th>Formato</th><th>Compra mínima</th><th>Precio por saco</th></tr></thead><tbody>
          <tr><td>Maíz molido (fino o grueso)</td><td>Saco 25 kg</td><td>10 sacos · 250 kg</td><td>${PEND()}</td></tr>
          <tr><td>Avena forrajera</td><td>Saco 25 kg</td><td>20 sacos · 500 kg</td><td>${PEND()}</td></tr>
          <tr><td>Harina de soya 48 % proteína</td><td>Saco 50 kg</td><td>5 sacos · 250 kg</td><td>${PEND()}</td></tr>
          <tr><td>Pellet de girasol</td><td>${PEND()}</td><td>${PEND()}</td><td>${PEND()}</td></tr>
        </tbody></table>
        <ul class="list mt">
          <li><span>El contador parte en la compra mínima y no deja bajar de ella.</span></li>
          <li><span>El maíz permite elegir molienda fina o gruesa.</span></li>
          <li><span>Cada ficha muestra formato, mínimo y forma de entrega.</span></li>
        </ul>
      </div>
      ${browserShot(key, 'tienda', 'agrotrade.cl/#tienda', 140)}
    </div>`));

  P.push(page(b, 8, total, 'Flujo de compra', `
    <p class="eyebrow">Cómo comprar</p><h2>Del carro a la bodega en cinco pasos</h2>
    <ol class="steps mt">
      <li><b>Arma tu pedido</b><span class="muted">Productos y cantidad, respetando el mínimo.</span></li>
      <li><b>Envíalo</b><span class="muted">Retiro en Rancagua o despacho a predio.</span></li>
      <li><b>Confirmamos</b><span class="muted">Stock, flete y fecha por WhatsApp.</span></li>
      <li><b>Pagas</b><span class="muted">Transferencia al contado antes de la entrega.</span></li>
      <li><b>Recibes</b><span class="muted">En bodega o en tu predio.</span></li>
    </ol>
    <div class="phones mt sm" style="justify-content:flex-start;gap:10mm">
      ${phone(key, 'cart', 'Carro con sacos y peso total')}
      ${phone(key, 'datos', 'Datos, entrega y pago')}
      <div class="stack" style="max-width:85mm">
        <div class="box"><h3>Por qué así</h3><p class="muted">El flete depende del destino y del peso, por eso el carro muestra los kilos y la confirmación final se hace por WhatsApp antes del pago. Es el mismo proceso que usa hoy Agrotrade, ordenado en el sitio.</p></div>
        <div class="box"><h3>Medios de pago</h3><p class="muted">Transferencia al contado. Agregar pago con tarjeta: ${PEND()}</p></div>
      </div>
    </div>`));

  P.push(page(b, 9, total, 'Pedidos por volumen', `
    <div class="cols" style="grid-template-columns:.8fr 1.2fr">
      <div class="stack">
        <p class="eyebrow">Pedidos de mayor calibre</p><h2 style="font-size:26pt">Cotización por volumen</h2>
        <p class="muted mt">Para camiones completos, contratos de temporada o mezclas de productos. El formulario reúne lo necesario para cotizar con flete en una sola respuesta.</p>
        <ul class="list mt">
          <li><span><b>Qué pide:</b> productos, volumen por envío (de menos de 1 t a camión completo), frecuencia y comuna de entrega.</span></li>
          <li><span><b>A dónde llega:</b> rinostroza@agrotrade.cl y WhatsApp ${PEND()}</span></li>
          <li><span><b>Condiciones por volumen</b> (descuentos, plazos): ${PEND()}</span></li>
        </ul>
      </div>
      ${browserShot(key, 'volumen', 'agrotrade.cl/#volumen', 128)}
    </div>`, 'dark'));

  P.push(page(b, 10, total, 'Versión móvil', `
    <p class="eyebrow">Celular primero</p><h2>Pensado para comprar desde el teléfono</h2>
    <div class="phones mt2">
      ${phone(key, 'home', 'Portada')}
      ${phone(key, 'tienda', 'Tienda')}
      ${phone(key, 'cart', 'Carro')}
      ${phone(key, 'volumen', 'Cotización por volumen')}
    </div>`));

  P.push(page(b, 11, total, 'Datos pendientes', `
    <p class="eyebrow">Para completar</p><h2>Lo que falta para pasar a producción</h2>
    <table class="mt"><thead><tr><th>Dato</th><th>Dónde se usa</th><th>Estado</th></tr></thead><tbody>
      <tr><td>Precio por saco de cada producto</td><td>Tienda, carro y cotizaciones</td><td>${PEND()}</td></tr>
      <tr><td>Ficha del pellet de girasol (formato, proteína, mínimo)</td><td>Tienda</td><td>${PEND()}</td></tr>
      <tr><td>Número de WhatsApp</td><td>Botón fijo y confirmación de pedidos</td><td>${PEND()}</td></tr>
      <tr><td>Dirección y horario de la bodega</td><td>Retiro, pie de página y Google Maps</td><td>${PEND()}</td></tr>
      <tr><td>Zonas y costo de despacho</td><td>Checkout y preguntas frecuentes</td><td>${PEND()}</td></tr>
      <tr><td>Condiciones para pedidos por volumen</td><td>Sección de cotización</td><td>${PEND()}</td></tr>
      <tr><td>Razón social y RUT</td><td>Pie de página y documentos tributarios</td><td>${PEND()}</td></tr>
      <tr><td>Historia de la familia y la empresa</td><td>Sección Nosotros</td><td>${PEND()}</td></tr>
      <tr><td>Fotos reales de los productos y logo</td><td>Tienda y portada (hoy son ilustraciones)</td><td>${PEND()}</td></tr>
      <tr><td>Plataforma de la tienda y medios de pago</td><td>Montaje del sitio</td><td>${PEND()}</td></tr>
      <tr><td>Acceso al dominio y al hosting actual</td><td>Publicación y redirección de direcciones antiguas</td><td>${PEND()}</td></tr>
    </tbody></table>`));

  P.push(page(b, 12, total, 'Próximos pasos', `
    <p class="eyebrow">Hoja de ruta</p><h2>De la maqueta al sitio publicado</h2>
    <ol class="steps mt2" style="grid-template-columns:repeat(6,1fr)">
      <li><b>Revisar</b><span class="muted">Revisar este concepto en familia y anotar cambios.</span></li>
      <li><b>Completar</b><span class="muted">Reunir los datos pendientes de la página anterior.</span></li>
      <li><b>Fotografiar</b><span class="muted">Fotos de sacos, bodega y entregas.</span></li>
      <li><b>Elegir</b><span class="muted">Plataforma de tienda y medios de pago.</span></li>
      <li><b>Montar</b><span class="muted">Cargar catálogo, precios y textos reales.</span></li>
      <li><b>Lanzar</b><span class="muted">Probar compras, redirigir direcciones antiguas y publicar.</span></li>
    </ol>
    <div class="cols c2 mt2" style="flex:none">
      <div class="box"><h3>Fechas</h3><p class="muted">Calendario de cada etapa: ${PEND()}</p></div>
      <div class="box"><h3>Maqueta interactiva</h3><p class="muted">Se puede navegar, agregar productos al carro y probar los formularios en ${b.artifact}</p></div>
    </div>`));
  return { css, html: P.join('\n') };
}

/* ---------- CASACAKE ---------- */
function casacake(key, b) {
  b.mark = 'casacake.'; b.domain = 'casacake.cl';
  const css = `
:root{--bg:#FFF9F7;--surface:#FFFFFF;--ink:#2C1714;--muted:#76605B;--line:#F0DDD7;--bar:#FBEFEB;
--berry:#C3345A;--accent:#C3345A;--accent-text:#C3345A;--crust:#E2A851;--manjar:#9A5A24;
--pend:#A9581A;--pend-bg:#FDF0E2;--r:3mm;--dot-r:50%;
--f-display:"Bricolage Grotesque","Trebuchet MS",sans-serif;--f-body:"Figtree",Arial,sans-serif;--f-mono:"DM Mono",monospace;
--h2:28pt;--h3:14pt;--tt:none;--h-ls:-.02em;--mark-font:800 12pt/1 "Bricolage Grotesque";--mark-ls:-.03em;--mark-tt:none}
.cover{padding:0}
.cover .in{display:grid;grid-template-columns:1fr 1fr;height:100%}
.cover .l{padding:16mm 0 14mm 18mm;display:flex;flex-direction:column}
.cover .brand{font:800 54pt/0.9 var(--f-display);letter-spacing:-.05em}
.cover .brand i{font-style:normal;color:var(--berry)}
.cover h1{font:800 40pt/0.95 var(--f-display);letter-spacing:-.04em;margin-top:auto}
.cover h1 span{color:var(--berry)}
.cover p{color:var(--muted);max-width:115mm;margin-top:5mm;font-size:11pt}
.cover .meta{margin-top:10mm;display:flex;gap:10mm;font:400 8pt/1.4 var(--f-mono);color:var(--muted)}
.cover .meta b{display:block;color:var(--ink);font-weight:500}
.cover .r{display:flex;align-items:center;justify-content:center;padding:14mm}
.cover .r img{width:100%;display:block}
.dark{background:var(--ink);color:var(--bg)}
.dark .ph,.dark .pf{border-color:rgb(255 249 247 / .15);color:#B9A19B}.dark .ph .mark{color:var(--bg)}
.dark .muted,.dark .lede{color:#D9C6C1}.dark .eyebrow{color:#EE6B8B}
.dark .list li::before{background:#EE6B8B}
`;
  const P = [];
  const total = 13;
  P.push(`<section class="page cover"><div class="in">
    <div class="l">
      <p class="eyebrow">Concepto de sitio web y tienda en línea</p>
      <div class="brand" style="margin-top:6mm">casacake<i>.</i></div>
      <h1>Listas para <span>rellenar.</span></h1>
      <p>Propuesta para renovar casacake.cl: una tienda que muestra bien las bases horneadas, ayuda a calcular cuánto comprar y abre un canal directo para empresas y mayoristas.</p>
      <div class="meta"><span><b>Fecha</b>Octubre 2026</span><span><b>Estado</b>Borrador para revisión</span><span><b>Maqueta interactiva</b>${b.artifact.replace('https://', '')}</span></div>
    </div>
    <div class="r"><img src="${img(key, 'hero-art')}" alt=""></div>
  </div></section>`);

  P.push(page(b, 2, total, 'Punto de partida', `
    <p class="eyebrow">Diagnóstico</p><h2>Qué tiene hoy casacake.cl</h2>
    <div class="cols c2 mt2">
      <div class="box"><h3>Lo que funciona</h3><ul class="list">
        <li><span>Propuesta clara: <b>bases horneadas listas para rellenar</b> (tacitas, tartaletas, cachitos, hojarasca).</span></li>
        <li><span>Tienda en línea con precios publicados y línea <b>Dulces Premium</b>.</span></li>
        <li><span>Presencia en <b>supermercados Lider</b> y otros canales (Falabella, Mercado Libre, Uber Eats).</span></li>
        <li><span>Fichas con información útil: «dulce o salado, frío o caliente», 5 días de duración una vez abierta.</span></li>
      </ul></div>
      <div class="box"><h3>Lo que hay que corregir</h3><ul class="list">
        <li><span>El <b>pack de 3 bandejas de tacitas</b> ($14.900) cuesta más que 3 bandejas sueltas (3 × $4.500 = $13.500).</span></li>
        <li><span>La hojarasca aparece a <b>$4.500</b> en una página y a <b>$3.600</b> en otra.</span></li>
        <li><span>Ubicación inconsistente: el sitio habla de la Sexta Región y el contacto aparece en Santiago.</span></li>
        <li><span>Precio de las galletitas para mini alfajores no visible.</span></li>
        <li><span>No hay un canal para banqueteras, pastelerías ni distribuidores.</span></li>
        <li><span>Mini chilenito agotado sin aviso de reposición.</span></li>
      </ul></div>
    </div>`));

  P.push(page(b, 3, total, 'Objetivo y público', `
    <p class="eyebrow">Objetivo</p><h2>Vender bandejas en línea y crecer en ventas a empresas</h2>
    <p class="lede">El sitio tiene que resolver la pregunta del cliente de hogar («¿cuánto compro para mi cóctel?») y darle a un negocio una forma simple de pedir precio por volumen.</p>
    <div class="cols c3 mt2">
      <div class="box"><h3>Anfitriones y hogar</h3><p class="muted">Cumpleaños, bautizos y fiestas. Quieren saber cuántas bandejas comprar e ideas para rellenar.</p></div>
      <div class="box"><h3>Reposteras y pastelerías</h3><p class="muted">Usan bases y hojarasca como insumo. Comparan precio por unidad y compran seguido.</p></div>
      <div class="box"><h3>Banqueteras, hoteles y distribuidores</h3><p class="muted">Compran por volumen. Necesitan precio mayorista, despacho programado y un contacto directo.</p></div>
    </div>
    <div class="box mt"><p><b>Mensaje principal:</b> «Listas para rellenar».</p></div>`));

  P.push(page(b, 4, total, 'Identidad visual', `
    <p class="eyebrow">Identidad</p><h2>La bandeja vista desde arriba</h2>
    <div class="cols c2 mt">
      <div class="stack">
        <p class="muted">Fondo claro de merengue, masa dorada y cacao. La frambuesa se reserva para botones y acentos. Los productos se muestran en su bandeja vista desde arriba, para que se entienda el formato y la cantidad de un vistazo.</p>
        <div class="swatches">
          <div class="sw"><div style="background:#C3345A"></div><p>Frambuesa<small>#C3345A</small></p></div>
          <div class="sw"><div style="background:#2C1714"></div><p>Cacao<small>#2C1714</small></p></div>
          <div class="sw"><div style="background:#E2A851"></div><p>Masa horneada<small>#E2A851</small></p></div>
          <div class="sw"><div style="background:#9A5A24"></div><p>Manjar<small>#9A5A24</small></p></div>
          <div class="sw"><div style="background:#F6E8E2"></div><p>Bandeja<small>#F6E8E2</small></p></div>
          <div class="sw"><div style="background:#FFF9F7"></div><p>Merengue<small>#FFF9F7</small></p></div>
        </div>
        <p class="note">Logo: mantener el actual o rediseñar. ${PEND()}</p>
      </div>
      <div class="type">
        <div class="t"><small>Títulos<br>Bricolage Grotesque</small><span style="font:800 30pt/1 var(--f-display);letter-spacing:-.04em">Listas para rellenar.</span></div>
        <div class="t"><small>Texto<br>Figtree</small><span style="font-size:11pt">Horneada, neutra y crujiente. Rellénala con lo que prefieras: dulce o salado, frío o caliente.</span></div>
        <div class="t"><small>Datos<br>DM Mono</small><span style="font:400 10pt/1.5 var(--f-mono)">3 bandejas × 24 · 72 unidades · $207 c/u</span></div>
        <div class="t"><small>Tono</small><span>Cercano y alegre, con datos concretos: unidades, duración y precio por bocado.</span></div>
      </div>
    </div>`));

  P.push(page(b, 5, total, 'Estructura del sitio', `
    <p class="eyebrow">Mapa del sitio</p><h2>Comprar, calcular y cotizar en una página</h2>
    <p class="lede">Una sola página de inicio con secciones, carro siempre visible y botón de WhatsApp fijo.</p>
    <div class="map mt2">
      <div class="node root"><b>Inicio</b>Portada con propuesta y enlace a Lider</div>
      <div class="map-line"></div>
      <div class="map-row" style="grid-template-columns:repeat(6,1fr)">
        <div class="node"><b>Tienda</b>Bases cóctel, para dulces chilenos y dulces premium</div>
        <div class="node"><b>Calculadora</b>Bandejas según invitados</div>
        <div class="node"><b>Ideas</b>Rellenos para cada base</div>
        <div class="node"><b>Empresas</b>Formulario mayorista</div>
        <div class="node"><b>Nosotros</b>Historia de la familia ${PEND()}</div>
        <div class="node"><b>Contacto</b>Correo y WhatsApp ${PEND()}</div>
      </div>
      <div class="map-row mt" style="grid-template-columns:1fr 1fr 1fr">
        <div class="node alt"><b>Carro</b>Productos, cantidades y subtotal</div>
        <div class="node alt"><b>Entrega y pago</b>Retiro o despacho; tarjeta o transferencia</div>
        <div class="node alt"><b>Confirmación</b>Resumen del pedido</div>
      </div>
    </div>`));

  P.push(page(b, 6, total, 'Página de inicio', `
    <div class="cols c-shot">
      <div class="stack">
        <p class="eyebrow">Portada</p><h2 style="font-size:24pt">Lo primero que se ve</h2>
        <ul class="list mt">
          <li><span><b>Titular corto</b> con la idea central: listas para rellenar.</span></li>
          <li><span><b>Bandeja ilustrada</b> con algunas bases ya rellenas.</span></li>
          <li><span><b>Dos caminos:</b> comprar ahora o ventas a empresas.</span></li>
          <li><span><b>Enlace a Lider</b> para quien prefiere el supermercado.</span></li>
        </ul>
      </div>
      ${browserShot(key, 'home', 'casacake.cl', 150)}
    </div>`));

  P.push(page(b, 7, total, 'Tienda', `
    <p class="eyebrow">Catálogo</p><h2 style="font-size:24pt">Productos actuales y precio por unidad</h2>
    <table class="mt"><thead><tr><th>Producto</th><th>Formato</th><th class="n">Precio publicado</th><th class="n">Por unidad</th><th>Observación</th></tr></thead><tbody>
      <tr><td>Tacita cóctel neutra</td><td>Bandeja 50 un</td><td class="n">$4.500</td><td class="n">$90</td><td class="muted">—</td></tr>
      <tr><td>Tacita cóctel neutra · Pack 3</td><td>150 un</td><td class="n">$14.900</td><td class="n">$99</td><td>Más caro por unidad que 3 bandejas sueltas. ${PEND('Revisar')}</td></tr>
      <tr><td>Mini tartaleta flor cóctel · Pack 3</td><td>3 × 24 · 72 un</td><td class="n">$14.900</td><td class="n">$207</td><td class="muted">—</td></tr>
      <tr><td>Cachito cóctel · Pack 3</td><td>3 × 30 · 90 un</td><td class="n">$14.900</td><td class="n">$166</td><td class="muted">—</td></tr>
      <tr><td>Hojarasca cóctel</td><td>60 tapitas</td><td class="n">$4.500</td><td class="n">$75</td><td>Aparece a $3.600 en otra página. ${PEND('Revisar')}</td></tr>
      <tr><td>Mini chilenito · Pack 3</td><td>3 × 12 · 36 un</td><td class="n">$10.490</td><td class="n">$291</td><td>Agotado en el sitio actual</td></tr>
      <tr><td>Galletitas para mini alfajores · Pack 3</td><td>110 un · chocolate</td><td class="n">${PEND()}</td><td class="n">—</td><td class="muted">—</td></tr>
      <tr><td>Chilenos rellenos de manjar</td><td>Caja 6 un</td><td class="n">${PEND()}</td><td class="n">—</td><td>Rango visto: $2.500 – $2.790</td></tr>
      <tr><td>Chilenos con manjar y baño de merengue</td><td>Caja 6 un</td><td class="n">${PEND()}</td><td class="n">—</td><td>Rango visto: $2.500 – $2.790</td></tr>
    </tbody></table>
    <p class="note mt">Precios tomados del sitio actual en octubre de 2026. Confirmar todos antes de publicar.</p>`));

  P.push(page(b, 8, total, 'Tienda', `
    <div class="cols c-shot">
      <div class="stack">
        <p class="eyebrow">Fichas de producto</p><h2 style="font-size:24pt">Formato y precio de un vistazo</h2>
        <ul class="list mt">
          <li><span><b>Filtros:</b> bases cóctel, para dulces chilenos y dulces premium.</span></li>
          <li><span><b>Precio por unidad</b> en cada ficha para comparar formatos.</span></li>
          <li><span><b>Agotado</b> visible y botón desactivado.</span></li>
          <li><span>Ilustraciones de bandeja hasta tener fotos reales. ${PEND('Fotos')}</span></li>
        </ul>
      </div>
      ${browserShot(key, 'tienda', 'casacake.cl/#tienda', 150)}
    </div>`));

  P.push(page(b, 9, total, 'Calculadora de cóctel', `
    <div class="cols c-shot">
      <div class="stack">
        <p class="eyebrow">Herramienta</p><h2 style="font-size:24pt">¿Cuántas bandejas necesito?</h2>
        <p class="muted mt">El cliente indica invitados y bocados por persona, elige las bases y la calculadora arma la compra más económica con los formatos disponibles. Un clic lo agrega todo al carro.</p>
        <div class="box mt"><div class="kpi"><span class="note">Ejemplo de la maqueta</span><strong>40 invitados × 6 bocados</strong><span class="muted">240 bocados entre tacitas, mini tartaletas y cachitos: $53.700 con los precios publicados.</span></div></div>
        <p class="note">Sugiere cotizar como empresa sobre 300 personas.</p>
      </div>
      ${browserShot(key, 'calculadora', 'casacake.cl/#calculadora', 112)}
    </div>`));

  P.push(page(b, 10, total, 'Empresas y mayoristas', `
    <div class="cols" style="grid-template-columns:.8fr 1.2fr">
      <div class="stack">
        <p class="eyebrow">Pedidos de mayor calibre</p><h2 style="font-size:24pt">Ventas a empresas</h2>
        <p class="muted mt">Para banqueteras, pastelerías, hoteles, casinos, cafeterías y distribuidores. El formulario reúne lo necesario para enviar una propuesta por volumen.</p>
        <ul class="list mt">
          <li><span><b>Qué pide:</b> tipo de negocio, productos, bandejas al mes, frecuencia y ciudad.</span></li>
          <li><span><b>A dónde llega:</b> correo y WhatsApp de ventas ${PEND()}</span></li>
          <li><span><b>Condiciones mayoristas</b> (mínimos y descuentos): ${PEND()}</span></li>
        </ul>
      </div>
      ${browserShot(key, 'empresas', 'casacake.cl/#empresas', 122)}
    </div>`, 'dark'));

  P.push(page(b, 11, total, 'Versión móvil', `
    <p class="eyebrow">Celular primero</p><h2>Comprar desde el teléfono, en pocos toques</h2>
    <div class="phones mt2">
      ${phone(key, 'home', 'Portada')}
      ${phone(key, 'tienda', 'Tienda')}
      ${phone(key, 'calculadora', 'Calculadora')}
      ${phone(key, 'datos', 'Entrega y pago')}
    </div>`));

  P.push(page(b, 12, total, 'Datos pendientes', `
    <p class="eyebrow">Para completar</p><h2>Lo que falta para pasar a producción</h2>
    <table class="mt"><thead><tr><th>Dato</th><th>Dónde se usa</th><th>Estado</th></tr></thead><tbody>
      <tr><td>Confirmar precios publicados (pack de tacitas, hojarasca)</td><td>Tienda y calculadora</td><td>${PEND()}</td></tr>
      <tr><td>Precio de galletitas para mini alfajores y de los chilenos</td><td>Tienda</td><td>${PEND()}</td></tr>
      <tr><td>Correo y WhatsApp de ventas</td><td>Contacto y formulario de empresas</td><td>${PEND()}</td></tr>
      <tr><td>Dirección oficial (Rancagua o Santiago) y horario</td><td>Retiro, pie de página y Google Maps</td><td>${PEND()}</td></tr>
      <tr><td>Zonas, costo y días de despacho</td><td>Checkout y preguntas frecuentes</td><td>${PEND()}</td></tr>
      <tr><td>Duración de cada base una vez abierta</td><td>Fichas y preguntas frecuentes</td><td>${PEND()}</td></tr>
      <tr><td>Condiciones mayoristas (mínimos y descuentos)</td><td>Sección Empresas</td><td>${PEND()}</td></tr>
      <tr><td>RUT de Casacake SpA</td><td>Pie de página y documentos tributarios</td><td>${PEND()}</td></tr>
      <tr><td>Historia de la familia y la empresa</td><td>Sección Nosotros</td><td>${PEND()}</td></tr>
      <tr><td>Fotos reales de los productos y logo</td><td>Tienda y portada (hoy son ilustraciones)</td><td>${PEND()}</td></tr>
      <tr><td>Plataforma de la tienda y medios de pago</td><td>Montaje del sitio</td><td>${PEND()}</td></tr>
      <tr><td>Acceso al dominio y al hosting actual</td><td>Publicación y redirección de direcciones antiguas</td><td>${PEND()}</td></tr>
    </tbody></table>`));

  P.push(page(b, 13, total, 'Próximos pasos', `
    <p class="eyebrow">Hoja de ruta</p><h2>De la maqueta al sitio publicado</h2>
    <ol class="steps mt2" style="grid-template-columns:repeat(6,1fr)">
      <li><b>Revisar</b><span class="muted">Revisar este concepto en familia y anotar cambios.</span></li>
      <li><b>Completar</b><span class="muted">Reunir los datos pendientes de la página anterior.</span></li>
      <li><b>Fotografiar</b><span class="muted">Fotos de bandejas, productos rellenos y planta.</span></li>
      <li><b>Elegir</b><span class="muted">Plataforma de tienda y medios de pago.</span></li>
      <li><b>Montar</b><span class="muted">Cargar catálogo, precios y textos reales.</span></li>
      <li><b>Lanzar</b><span class="muted">Probar compras, redirigir direcciones antiguas y publicar.</span></li>
    </ol>
    <div class="cols c2 mt2" style="flex:none">
      <div class="box"><h3>Fechas</h3><p class="muted">Calendario de cada etapa: ${PEND()}</p></div>
      <div class="box"><h3>Maqueta interactiva</h3><p class="muted">Se puede navegar, usar la calculadora, agregar productos al carro y probar los formularios en ${b.artifact}</p></div>
    </div>`));
  return { css, html: P.join('\n') };
}

/* ---------- armado ---------- */
(async () => {
  const browser = await chromium.launch();
  for (const [key, b] of Object.entries(BRANDS)) {
    if (!process.argv.includes('--sin-capturas')) await capture(browser, key, b);
    const { css, html } = (key === 'agrotrade' ? agrotrade : casacake)(key, b);
    const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Concepto ${b.mark}</title>
      <style>${fontFaces(b.fonts)}\n${BASE_CSS}\n${css}</style></head><body>${html}</body></html>`;
    const htmlPath = path.join(SHOTS, `${key}-concepto.html`);
    fs.writeFileSync(htmlPath, doc);
    const p = await browser.newPage();
    await p.goto('file://' + htmlPath, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.join(DIR, b.file), width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
    await p.close();
    console.log('Listo:', b.file);
  }
  await browser.close();
})();
