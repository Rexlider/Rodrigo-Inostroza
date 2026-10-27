// Genera el sitio estático de Casacake en dist/ a partir de data/*.json.
//   node build.mjs              producción: exige los datos mínimos y oculta los que falten
//   node build.mjs --borrador   marca los datos pendientes en las páginas (para revisión)
//   node build.mjs --local      enlaces con index.html, para abrir los archivos sin servidor
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'dist');
const BORRADOR = process.argv.includes('--borrador');
const LOCAL = process.argv.includes('--local');

const sitio = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sitio.json'), 'utf8'));
const { categorias, productos, ideas } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/productos.json'), 'utf8'));

/* ---------- revisión de datos ---------- */
const pendientes = [];
const falta = (cond, msg) => { if (!cond) pendientes.push(msg); };
const vendedorWa = sitio.vendedores.find(v => v.whatsapp);
falta(vendedorWa, 'WhatsApp de al menos un vendedor (data/sitio.json → vendedores[].whatsapp, formato 569XXXXXXXX)');
falta(sitio.correo, 'Correo de ventas (data/sitio.json → correo)');
falta(sitio.direccion, 'Dirección (data/sitio.json → direccion)');
falta(sitio.horario, 'Horario de atención (data/sitio.json → horario)');
falta(sitio.rut, 'RUT de la empresa (data/sitio.json → rut)');
for (const p of productos) {
  for (const k of ['medidas', 'peso', 'pesoNeto', 'duracion', 'conservacion', 'ean']) falta(p[k], `${p.codigo}: ${k}`);
  falta(p.fotos.length, `${p.codigo}: fotos`);
  for (const f of p.fotos) if (!fs.existsSync(path.join(ROOT, 'img', f))) { console.error(`Falta la imagen img/${f} (${p.codigo})`); process.exit(1); }
  if (sitio.mostrarPrecios) falta(p.precio, `${p.codigo}: precio`);
}
// líneas e ideas sin productos vigentes no se publican
const lineas = categorias.filter(c => productos.some(p => p.categoria === c.id));
const ideasVigentes = ideas
  .map(i => ({ ...i, productos: i.productos.filter(c => productos.some(p => p.codigo === c)) }))
  .filter(i => i.productos.length);
const codigos = productos.map(p => p.codigo);
const repetidos = codigos.filter((c, i) => codigos.indexOf(c) !== i);
if (repetidos.length) { console.error('Códigos repetidos:', repetidos.join(', ')); process.exit(1); }
if (!BORRADOR && !vendedorWa) {
  console.error('No se puede publicar sin un número de WhatsApp de vendedor. Usa --borrador para revisar.');
  process.exit(1);
}

/* ---------- utilidades ---------- */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = new Intl.NumberFormat('es-CL');
const money = n => '$' + nf.format(n);
const slug = p => p.codigo.toLowerCase();
const PEND = (t = 'Por completar') => BORRADOR ? `<span class="pend">${esc(t)}</span>` : '';
const waLink = (num, text) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
const catById = id => categorias.find(c => c.id === id);
const prodByCode = c => productos.find(p => p.codigo === c);

// enlaces relativos para que el sitio funcione en cualquier carpeta o servidor
function link(from, to) {
  const depth = from.split('/').filter(Boolean).length;
  let target = to;
  if (LOCAL) target = to === '' ? 'index.html' : to.replace(/\/(\?|#|$)/, '/index.html$1');
  const prefix = depth ? '../'.repeat(depth) : './';
  return prefix + target;
}

/* ---------- ilustraciones (se reemplazan por fotos cuando existan) ---------- */
const item = {
  tacita: (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" class="cr"/><circle cx="${x}" cy="${y}" r="${r - 2.5}" class="flute"/><circle cx="${x}" cy="${y}" r="${r * .58}" class="${f || 'hollow'}"/>`,
  flor(x, y, r, f) { let s = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<circle cx="${(x + Math.cos(a) * r * .66).toFixed(1)}" cy="${(y + Math.sin(a) * r * .66).toFixed(1)}" r="${(r * .36).toFixed(1)}" class="cr"/>`; } return s + `<circle cx="${x}" cy="${y}" r="${r * .7}" class="cr"/><circle cx="${x}" cy="${y}" r="${r * .48}" class="${f || 'hollow'}"/>`; },
  hoja: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" class="cr-l"/><circle cx="${x - r * .3}" cy="${y - r * .25}" r="${r * .09}" class="dots"/><circle cx="${x + r * .35}" cy="${y - r * .1}" r="${r * .07}" class="dots"/><circle cx="${x - r * .05}" cy="${y + r * .3}" r="${r * .08}" class="dots"/><circle cx="${x + r * .25}" cy="${y + r * .4}" r="${r * .06}" class="dots"/>`,
  cachito: (x, y, r, f) => `<path d="M${x - r * .15} ${y + r} L${x - r * .85} ${y - r * .45} Q${x} ${y - r * 1.15} ${x + r * .85} ${y - r * .45} Z" class="cr"/><path d="M${x - r * .55} ${y - r * .05} Q${x} ${y - r * .3} ${x + r * .6} ${y}" class="spiral"/><path d="M${x - r * .38} ${y + r * .35} Q${x} ${y + r * .15} ${x + r * .32} ${y + r * .35}" class="spiral"/><ellipse cx="${x}" cy="${y - r * .62}" rx="${r * .72}" ry="${r * .32}" class="${f || 'hollow'}"/>`,
  chilenito: (x, y, r, mer) => `<ellipse cx="${x}" cy="${y + r * .45}" rx="${r}" ry="${r * .28}" class="cr-d"/><rect x="${x - r}" y="${y + r * .05}" width="${2 * r}" height="${r * .4}" class="cr"/><ellipse cx="${x}" cy="${y + r * .05}" rx="${r}" ry="${r * .28}" class="mj"/><rect x="${x - r}" y="${y - r * .3}" width="${2 * r}" height="${r * .35}" class="mj"/><ellipse cx="${x}" cy="${y - r * .3}" rx="${r}" ry="${r * .28}" class="cr"/><rect x="${x - r}" y="${y - r * .62}" width="${2 * r}" height="${r * .32}" class="cr"/><ellipse cx="${x}" cy="${y - r * .62}" rx="${r}" ry="${r * .28}" class="${mer ? 'me' : 'cr-l'}"/>${mer ? `<ellipse cx="${x}" cy="${y - r * .75}" rx="${r * .8}" ry="${r * .24}" class="me"/>` : ''}`,
  alfajor: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" class="co"/><circle cx="${x}" cy="${y}" r="${r * .72}" class="mj"/><circle cx="${x}" cy="${y}" r="${r * .6}" class="co"/>`
};
const LAYOUT = {
  tacita: {}, flor: {}, cachito: { r: 19 }, hoja: { cols: 5, r: 16 }, alfajor: { cols: 5, r: 15 },
  chilenito: { r: 18 }, chileno: { cols: 3, rows: 2, r: 26 }, 'chileno-mer': { cols: 3, rows: 2, r: 26 }
};
function tray(kind, opts = {}) {
  const o = { ...LAYOUT[kind], ...opts };
  const W = 240, H = 170, cols = o.cols || 4, rows = o.rows || 3, r = o.r || 17, pad = Math.max(26, r + 16), fills = o.fills || [];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}"><rect x="6" y="8" width="${W - 12}" height="${H - 16}" rx="16" class="tray"/>`;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = pad + (W - 2 * pad) * (cols === 1 ? .5 : i / (cols - 1));
    const y = pad + 4 + (H - 2 * pad - 8) * (rows === 1 ? .5 : j / (rows - 1));
    const f = fills.length ? fills[(j * cols + i) % fills.length] : null;
    if (kind === 'chileno' || kind === 'chileno-mer' || kind === 'chilenito') s += item.chilenito(x, y, r, kind !== 'chileno');
    else s += item[kind](x, y, r, f);
  }
  return s + '</svg>';
}
const img = (from, file, alt, extra = '') => `<img src="${link(from, 'img/' + file)}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;
const art = (p, from) => p.fotos.length
  ? img(from, p.fotos[0], p.nombre, ' class="photo"')
  : tray(p.ilustracion, { label: p.nombre });

/* ---------- piezas de página ---------- */
const ICON_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z"/></svg>';

function card(p, from) {
  const cat = catById(p.categoria);
  return `<a class="card" href="${link(from, `productos/${slug(p)}/`)}" data-cat="${p.categoria}" data-search="${esc(`${p.codigo} ${p.nombre} ${cat.nombre}`)}">
    <div class="art">${art(p, from)}</div>${p.disponible ? '' : '<span class="badge">Agotado</span>'}
    <div class="body"><span class="code">${p.codigo}</span><h3>${esc(p.nombre)}</h3><span class="fmt">${esc(p.formato)} · ${p.unidades} unidades</span>
    ${sitio.mostrarPrecios && p.precio ? `<span class="price">${money(p.precio)}</span>` : ''}</div>
  </a>`;
}

function layout({ ruta, titulo, descripcion, cuerpo, actual, jsonld }) {
  const from = ruta;
  const url = sitio.dominio + '/' + ruta;
  const nav = [['productos/', 'Productos'], ['ideas/', 'Ideas'], ['empresas/', 'Empresas'], ['contacto/', 'Contacto']];
  const datos = {
    nombre: sitio.nombre, correo: sitio.correo, urlCatalogo: link(from, 'productos/'),
    vendedores: sitio.vendedores.filter(v => v.whatsapp || BORRADOR).map(v => ({ nombre: v.nombre, zona: v.zona, whatsapp: v.whatsapp })),
    productos: productos.map(p => ({ codigo: p.codigo, nombre: p.nombre, formato: p.formato, unidades: p.unidades }))
  };
  const ga = sitio.googleAnalytics && !BORRADOR
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${sitio.googleAnalytics}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${sitio.googleAnalytics}');</script>` : '';
  return `<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
${BORRADOR ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(sitio.nombre)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_CL">
${sitio.imagenCompartir ? `<meta property="og:image" content="${sitio.dominio}/img/${sitio.imagenCompartir}">` : ''}
<meta name="theme-color" content="#B90000">
<link rel="icon" href="${link(from, 'img/marca/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="icon" href="${link(from, 'img/marca/favicon-64.png')}" sizes="64x64" type="image/png">
<link rel="apple-touch-icon" href="${link(from, 'img/marca/apple-touch-icon.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${link(from, 'estilos.css')}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
${ga}
</head>
<body>
${BORRADOR ? `<div class="draft"><div class="wrap"><b>Borrador.</b> Los datos con <span class="pend">borde punteado</span> están pendientes y no aparecerán así en el sitio publicado.</div></div>` : ''}
<header class="top">
  <div class="wrap">
    <a class="brand" href="${link(from, '')}" aria-label="${esc(sitio.nombre)}, inicio">${sitio.logo ? `<img src="${link(from, 'img/' + sitio.logo)}" alt="${esc(sitio.nombre)}" width="600" height="136">` : 'casacake<i>.</i>'}</a>
    <nav class="nav" id="nav" aria-label="Principal">${nav.map(([h, t]) => `<a href="${link(from, h)}"${actual === h ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menú</button>
    <button class="list-btn" type="button" data-open-list aria-label="Abrir mi lista de consulta">Mi lista <span class="count" data-list-count>0</span></button>
  </div>
</header>
<main>
${cuerpo}
</main>
<footer>
  <div class="wrap">
    <div class="foot-brand">${sitio.sello ? img(from, sitio.sello, `Sello ${sitio.nombre}`, ' width="96" height="96"') : ''}<div><h4>${esc(sitio.razonSocial)}</h4><p>${esc(sitio.descripcion)}</p><p style="margin-top:8px">${esc(sitio.region)}</p></div></div>
    <div><h4>Contacto</h4><ul>
      ${vendedorWa ? `<li><a href="${waLink(vendedorWa.whatsapp, `Hola ${sitio.nombre}, quiero hacer una consulta.`)}" target="_blank" rel="noopener">WhatsApp +${vendedorWa.whatsapp}</a></li>` : `<li>WhatsApp ${PEND()}</li>`}
      ${sitio.correo ? `<li><a href="mailto:${sitio.correo}">${sitio.correo}</a></li>` : `<li>Correo ${PEND()}</li>`}
      ${sitio.direccion ? `<li>${esc(sitio.direccion)}</li>` : `<li>Dirección ${PEND()}</li>`}
    </ul></div>
    <div><h4>Catálogo</h4><ul>
      ${lineas.map(c => `<li><a href="${link(from, `productos/?cat=${c.id}`)}">${esc(c.nombre)}</a></li>`).join('')}
      <li><a href="${link(from, 'empresas/')}">Ventas a empresas</a></li>
      <li><a href="${link(from, 'contacto/#donde-comprar')}">Dónde comprar</a></li>
    </ul></div>
    <p class="legal">© ${new Date().getFullYear()} ${esc(sitio.razonSocial)}${sitio.rut ? ' · RUT ' + esc(sitio.rut) : (BORRADOR ? ' · RUT ' + PEND() : '')}${sitio.redes.facebook ? ` · <a href="${sitio.redes.facebook}" target="_blank" rel="noopener">Facebook</a>` : ''}${sitio.redes.instagram ? ` · <a href="${sitio.redes.instagram}" target="_blank" rel="noopener">Instagram</a>` : ''}</p>
  </div>
</footer>
<dialog class="drawer" id="lista" aria-labelledby="lista-t">
  <div class="drawer-in">
    <div class="drawer-head"><h2 id="lista-t">Mi lista de consulta</h2><button class="x" id="lista-x" type="button" aria-label="Cerrar">×</button></div>
    <div class="drawer-body" id="lista-body"></div>
    <div class="drawer-foot" id="lista-foot"></div>
  </div>
</dialog>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="cc-datos">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>
<script src="${link(from, 'app.js')}" defer></script>
</body>
</html>
`;
}

/* ---------- páginas ---------- */
const pages = [];
const add = (ruta, opts) => pages.push({ ruta, html: layout({ ruta, ...opts }) });

// inicio
{
  const from = '';
  const destacados = productos.filter(p => p.destacado);
  add('', {
    titulo: `${sitio.nombre} · Bases horneadas listas para rellenar`,
    descripcion: sitio.descripcion,
    jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: sitio.razonSocial, url: sitio.dominio, ...(sitio.correo && { email: sitio.correo }), ...(sitio.redes.facebook && { sameAs: [sitio.redes.facebook, sitio.redes.instagram].filter(Boolean) }) },
    cuerpo: `
<section class="hero" style="padding-block:0"><div class="wrap">
  <div>
    <p class="eyebrow">Bases horneadas · ${esc(sitio.region.split(',')[0])}</p>
    <h1>Listas para <span>rellenar.</span></h1>
    <p class="lede">Tacitas, tartaletas, cachitos y hojarasca horneadas y crujientes. Elige en el catálogo, anota el código y escríbele directo a tu vendedor.</p>
    <div class="ctas"><a class="btn btn-brand" href="${link(from, 'productos/')}">Ver catálogo</a><a class="btn btn-ghost" href="${link(from, 'empresas/')}">Ventas a empresas</a></div>
  </div>
  <div class="hero-art">${(() => {
    const conFoto = productos.filter((p, i, all) => p.fotos.length && all.findIndex(x => x.fotos[0] === p.fotos[0]) === i).slice(0, 2);
    if (!conFoto.length) return tray('tacita', { cols: 6, rows: 4, r: 15 });
    return `<div class="hero-photos">${conFoto.map(p => `<a href="${link(from, `productos/${slug(p)}/`)}">${img(from, p.fotos[0], p.nombre)}</a>`).join('')}${sitio.sello ? img(from, sitio.sello, `Sello ${sitio.nombre}`, ' class="hero-seal"') : ''}</div>`;
  })()}</div>
</div></section>
${sitio.dondeComprar.length ? `<div class="stores"><div class="wrap"><span>También en</span>${sitio.dondeComprar.map(d => `<a href="${d.url}" target="_blank" rel="noopener">${esc(d.nombre)}</a>`).join('')}</div></div>` : ''}
<section style="padding-top:24px"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">Catálogo</p><h2>Líneas de producto</h2></div></div>
  <div class="cats">${lineas.map(c => { const ps = productos.filter(p => p.categoria === c.id); return `<a class="cat" href="${link(from, `productos/?cat=${c.id}`)}">${art(ps[0], from)}<div><h3>${esc(c.nombre)}</h3><p>${esc(c.descripcion)}</p><span class="n">${ps.length} ${ps.length === 1 ? 'producto' : 'productos'}</span></div></a>`; }).join('')}</div>
</div></section>
<section style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">Destacados</p><h2>Los más pedidos</h2></div><a class="btn btn-ghost" href="${link(from, 'productos/')}">Ver todo el catálogo</a></div>
  <div class="grid">${destacados.map(p => card(p, from)).join('')}</div>
</div></section>
<section style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">Cómo pedir</p><h2>Directo con tu vendedor</h2></div><p>No hay pago en línea: el vendedor confirma stock, precio y entrega contigo.</p></div>
  <ol class="steps">
    <li><b>Elige en el catálogo</b><span>Cada producto tiene un código, por ejemplo CC-TAC-050.</span></li>
    <li><b>Arma tu lista</b><span>Agrega productos y cantidades, o consulta uno solo.</span></li>
    <li><b>Envíala por WhatsApp</b><span>El vendedor te responde con precio, stock y entrega.</span></li>
  </ol>
</div></section>
<div class="band"><div class="wrap">
  <div><p class="eyebrow">Empresas y mayoristas</p><h2>¿Compras por volumen?</h2><p>Banqueteras, pastelerías, hoteles, cafeterías y distribuidores: pide una propuesta con precios por volumen.</p></div>
  <a class="btn btn-brand" href="${link(from, 'empresas/')}">Pedir propuesta</a>
</div></div>`
  });
}

// catálogo
{
  const from = 'productos/';
  add(from, {
    titulo: `Productos · ${sitio.nombre}`, actual: from,
    descripcion: `Catálogo de ${sitio.nombre}: ${lineas.map(c => c.nombre.toLowerCase()).join(', ')}. Cada producto con su código para consultar directo al vendedor.`,
    cuerpo: `
<section style="padding-top:40px"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">Catálogo</p><h1 style="font-size:clamp(2rem,4.6vw,3rem)">Productos</h1></div><p>Busca por nombre o código. Agrega a tu lista y envíala al vendedor en un solo mensaje.</p></div>
  <div class="tools">
    <div class="chips" role="group" aria-label="Filtrar por línea">
      <a class="chip" href="${link(from, 'productos/')}" data-cat="todo" aria-pressed="true">Todo</a>
      ${lineas.map(c => `<a class="chip" href="${link(from, `productos/?cat=${c.id}`)}" data-cat="${c.id}" aria-pressed="false">${esc(c.nombre)}</a>`).join('')}
    </div>
    <div class="search"><label for="q" class="code" style="position:absolute;left:-9999px">Buscar</label><input id="q" type="search" placeholder="Buscar por nombre o código" autocomplete="off"></div>
  </div>
  <div class="grid" id="catalogo">${productos.map(p => card(p, from)).join('')}</div>
  <p class="empty-state" id="sin-resultados" hidden>No encontramos productos con esa búsqueda.</p>
</div></section>`
  });
}

// fichas
for (const p of productos) {
  const from = `productos/${slug(p)}/`;
  const cat = catById(p.categoria);
  const row = (k, v, always) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : (BORRADOR && !always ? `<dt>${k}</dt><dd>${PEND()}</dd>` : '');
  const msg = `Hola ${sitio.nombre}, quiero consultar por el producto ${p.codigo} ${p.nombre} (${p.formato.toLowerCase()}, ${p.unidades} unidades).`;
  const vendedores = sitio.vendedores.filter(v => v.whatsapp);
  const relacionados = productos.filter(x => x.categoria === p.categoria && x.codigo !== p.codigo).slice(0, 4);
  const ideasP = ideasVigentes.filter(i => i.productos.includes(p.codigo));
  add(from, {
    titulo: `${p.nombre} (${p.codigo}) · ${sitio.nombre}`, actual: 'productos/',
    descripcion: `${p.descripcion} ${p.formato} de ${p.unidades} unidades. Código ${p.codigo}.`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, sku: p.codigo, description: p.descripcion, brand: { '@type': 'Brand', name: sitio.nombre }, category: cat.nombre,
      ...(p.ean && { gtin13: p.ean }), ...(p.fotos.length && { image: p.fotos.map(f => `${sitio.dominio}/img/${f}`) }),
      ...(sitio.mostrarPrecios && p.precio && { offers: { '@type': 'Offer', price: p.precio, priceCurrency: 'CLP', availability: `https://schema.org/${p.disponible ? 'InStock' : 'OutOfStock'}` } }) },
    cuerpo: `
<div class="wrap">
  <nav class="crumbs" aria-label="Ruta"><a href="${link(from, '')}">Inicio</a><span>/</span><a href="${link(from, 'productos/')}">Productos</a><span>/</span><a href="${link(from, `productos/?cat=${cat.id}`)}">${esc(cat.nombre)}</a></nav>
  <div class="ficha">
    <div class="gallery">
      <div class="art">${art(p, from)}${p.disponible ? '' : '<span class="badge">Agotado</span>'}</div>
      ${p.fotos.length > 1 ? `<div class="thumbs">${p.fotos.map((f, i) => `<button type="button" data-foto="${link(from, 'img/' + f)}" aria-label="Ver foto ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}>${img(from, f, '')}</button>`).join('')}</div>` : ''}
    </div>
    <div class="info">
      <div class="code-row"><span class="code-big">${p.codigo}</span><button class="copy" type="button" data-copy-text="${p.codigo}">Copiar código</button></div>
      <h1>${esc(p.nombre)}</h1>
      <p class="muted" style="font-size:1.08rem">${esc(p.descripcion)}</p>
      ${p.usos.length ? `<div class="tags">${p.usos.map(u => `<span>${esc(u)}</span>`).join('')}</div>` : ''}
      <dl class="specs">
        ${row('Código', p.codigo, true)}${row('Línea', cat.nombre, true)}${row('Formato', p.formato, true)}${row('Unidades', String(p.unidades), true)}
        ${row('Medidas', p.medidas)}${row('Peso por unidad', p.peso)}${row('Peso neto', p.pesoNeto)}${row('Duración (envase cerrado)', p.duracion)}${p.abierta ? row('Una vez abierta', p.abierta) : ''}${row('Conservación', p.conservacion)}${row('Código de barras', p.ean)}
        ${sitio.mostrarPrecios ? row('Precio', p.precio && money(p.precio)) : ''}
      </dl>
      ${p.ingredientes || p.alergenos ? `<div class="ingred">${p.ingredientes ? `<p><b>Ingredientes:</b> ${esc(p.ingredientes)}</p>` : ''}${p.alergenos ? `<p><b>Contiene:</b> ${esc(p.alergenos)}</p>` : ''}</div>` : ''}
      <div class="ask">
        <p><b>${p.disponible ? 'Consulta precio y disponibilidad' : 'Producto agotado por ahora'}</b><br><span class="muted">${p.disponible ? 'Te responde directamente un vendedor de ' + esc(sitio.nombre) + '.' : 'Escríbenos y te avisamos cuando vuelva.'}</span></p>
        <div class="row">
          ${vendedores.length ? `<a class="btn btn-wa" href="${waLink(vendedores[0].whatsapp, msg)}" target="_blank" rel="noopener">${ICON_WA}Consultar por WhatsApp</a>` : `<span class="btn btn-wa" aria-disabled="true">${ICON_WA}Consultar por WhatsApp</span>`}
        </div>
        ${vendedores.length ? '' : PEND('Falta el WhatsApp del vendedor')}
        <div class="row" style="align-items:center">
          <div class="stepper"><button type="button" data-step="-1" aria-label="Menos">−</button><input type="number" id="qty-${p.codigo}" value="1" min="1" inputmode="numeric" aria-label="Cantidad"><button type="button" data-step="1" aria-label="Más">+</button></div>
          <button class="btn btn-ghost" type="button" data-add="${p.codigo}">Agregar a mi lista</button>
        </div>
      </div>
    </div>
  </div>
  ${ideasP.length ? `<section style="padding-top:0"><div class="sec-head"><div><p class="eyebrow">Ideas</p><h2>Cómo usarlo</h2></div></div><div class="ideas">${ideasP.map(i => `<div class="idea">${tray(i.ilustracion, { cols: 2, rows: 2, r: 30, fills: i.rellenos })}<h3>${esc(i.titulo)}</h3><p>${esc(i.texto)}</p></div>`).join('')}</div></section>` : ''}
  ${relacionados.length ? `<section style="padding-top:0"><div class="sec-head"><div><p class="eyebrow">${esc(cat.nombre)}</p><h2>También en esta línea</h2></div></div><div class="grid">${relacionados.map(x => card(x, from)).join('')}</div></section>` : ''}
</div>`
  });
}

// ideas
{
  const from = 'ideas/';
  add(from, {
    titulo: `Ideas para rellenar · ${sitio.nombre}`, actual: from,
    descripcion: 'Ideas de rellenos dulces y salados para tacitas, tartaletas, cachitos, hojarasca y mini alfajores.',
    cuerpo: `
<section style="padding-top:40px"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">Ideas para rellenar</p><h1 style="font-size:clamp(2rem,4.6vw,3rem)">Una base, muchos cócteles</h1></div><p>Rellenos dulces y salados para cada producto, con el código para pedirlo.</p></div>
  <div class="ideas">${ideasVigentes.map(i => `<div class="idea">${tray(i.ilustracion, { cols: 2, rows: 2, r: 30, fills: i.rellenos })}<h3>${esc(i.titulo)}</h3><p>${esc(i.texto)}</p><div class="links">${i.productos.map(c => `<a href="${link(from, `productos/${c.toLowerCase()}/`)}">${c}</a>`).join('')}</div></div>`).join('')}</div>
</div></section>`
  });
}

// empresas
{
  const from = 'empresas/';
  const noms = [...new Set(productos.map(p => p.nombre.replace(' · Pack 3', '')))];
  add(from, {
    titulo: `Ventas a empresas · ${sitio.nombre}`, actual: from,
    descripcion: `Propuestas por volumen para banqueteras, pastelerías, hoteles, cafeterías y distribuidores. Contacto directo con ventas de ${sitio.nombre}.`,
    cuerpo: `
<section style="padding-top:40px"><div class="wrap two">
  <div>
    <p class="eyebrow">Empresas y mayoristas</p>
    <h1 style="font-size:clamp(2rem,4.6vw,3rem)">Pedidos grandes, precio de fábrica</h1>
    <p class="muted" style="margin-top:16px;max-width:46ch">Cuéntanos qué productos usas y cuántas bandejas al mes. Te enviamos una propuesta con precios por volumen y despacho.</p>
    <div class="who"><span>Banqueteras</span><span>Pastelerías</span><span>Hoteles y casinos</span><span>Cafeterías</span><span>Distribuidores</span></div>
    ${BORRADOR ? `<p style="margin-top:20px">Condiciones mayoristas (mínimos, descuentos): ${PEND()}</p>` : ''}
  </div>
  <form class="form" id="b2b" novalidate>
    <div class="field"><label for="b-nombre">Nombre</label><input id="b-nombre" name="nombre" autocomplete="name" required></div>
    <div class="field"><label for="b-empresa">Empresa</label><input id="b-empresa" name="empresa" autocomplete="organization"></div>
    <div class="field"><label for="b-tipo">Tipo de negocio</label><select id="b-tipo" name="tipo"><option>Banquetería</option><option>Pastelería</option><option>Hotel o casino</option><option>Cafetería</option><option>Distribuidor</option><option>Otro</option></select></div>
    <div class="field"><label for="b-comuna">Ciudad o comuna</label><input id="b-comuna" name="comuna"></div>
    <div class="field full"><label for="b-tel">Teléfono</label><input id="b-tel" name="tel" type="tel" autocomplete="tel"></div>
    <fieldset class="field full"><legend>Productos de interés</legend><div class="checks">${noms.map((n, i) => `<label><input type="checkbox" name="prod" id="bp-${i}" value="${esc(n)}">${esc(n)}</label>`).join('')}</div></fieldset>
    <div class="field"><label for="b-vol">Bandejas al mes (aprox.)</label><select id="b-vol" name="vol"><option>Hasta 20</option><option selected>20 a 100</option><option>100 a 500</option><option>Más de 500</option></select></div>
    <div class="field"><label for="b-frec">Frecuencia</label><select id="b-frec" name="frec"><option>Semanal</option><option selected>Quincenal</option><option>Mensual</option><option>Por evento</option></select></div>
    <div class="field full"><label for="b-msg">Detalles</label><textarea id="b-msg" name="msg" placeholder="Ej.: hacemos 4 matrimonios al mes de 150 personas."></textarea></div>
    <div class="full actions"><p class="err" id="b2b-err" role="alert"></p>
      ${sitio.correo ? `<button class="btn btn-ghost" type="button" data-send="mail">Enviar por correo</button>` : ''}
      <button class="btn btn-wa" type="button" data-send="wa" ${vendedorWa ? '' : 'disabled'}>${ICON_WA}Enviar por WhatsApp</button>
    </div>
  </form>
</div></section>`
  });
}

// contacto
{
  const from = 'contacto/';
  add(from, {
    titulo: `Contacto · ${sitio.nombre}`, actual: from,
    descripcion: `Contacto directo con los vendedores de ${sitio.nombre} y dónde comprar nuestros productos.`,
    cuerpo: `
<section style="padding-top:40px"><div class="wrap two">
  <div>
    <p class="eyebrow">Contacto</p>
    <h1 style="font-size:clamp(2rem,4.6vw,3rem)">Habla directo con ventas</h1>
    <ul class="contact-list">
      ${sitio.vendedores.map(v => `<li><small>${esc(v.zona)}</small>${v.nombre ? `<b>${esc(v.nombre)}</b>` : (BORRADOR ? `<b>Nombre ${PEND()}</b>` : '')}${v.whatsapp ? `<a href="${waLink(v.whatsapp, `Hola ${sitio.nombre}, quiero hacer una consulta.`)}" target="_blank" rel="noopener">WhatsApp +${v.whatsapp}</a>` : `<span>WhatsApp ${PEND()}</span>`}</li>`).join('')}
      <li><small>Correo</small>${sitio.correo ? `<a href="mailto:${sitio.correo}">${sitio.correo}</a>` : `<span>${PEND()}</span>`}</li>
      <li><small>Dirección</small><span>${sitio.direccion ? esc(sitio.direccion) : PEND()}</span></li>
      <li><small>Horario</small><span>${sitio.horario ? esc(sitio.horario) : PEND()}</span></li>
    </ul>
  </div>
  <div id="donde-comprar">
    <p class="eyebrow">Dónde comprar</p>
    <h2>También en tiendas</h2>
    <ul class="contact-list">${sitio.dondeComprar.map(d => `<li><small>Tienda</small><a href="${d.url}" target="_blank" rel="noopener">${esc(d.nombre)}</a></li>`).join('')}</ul>
  </div>
</div></section>`
  });
}

// 404
pages.push({ ruta: '404.html', html: layout({ ruta: '', titulo: `Página no encontrada · ${sitio.nombre}`, descripcion: sitio.descripcion, cuerpo: `
<section><div class="wrap" style="display:grid;gap:16px;justify-items:start">
  <p class="eyebrow">Error 404</p><h1>No encontramos esta página</h1>
  <p class="muted">Puede que el producto haya cambiado de dirección. Búscalo por nombre o código en el catálogo.</p>
  <a class="btn btn-brand" href="/productos/">Ir al catálogo</a>
</div></section>` }).replace(/(href|src)="\.\/(?!\/)/g, '$1="/') });

/* ---------- escritura ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
for (const p of pages) {
  const file = p.ruta.endsWith('.html') ? path.join(OUT, p.ruta) : path.join(OUT, p.ruta, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, p.html);
}
fs.copyFileSync(path.join(ROOT, 'src/estilos.css'), path.join(OUT, 'estilos.css'));
fs.copyFileSync(path.join(ROOT, 'src/app.js'), path.join(OUT, 'app.js'));
if (fs.existsSync(path.join(ROOT, 'img'))) fs.cpSync(path.join(ROOT, 'img'), path.join(OUT, 'img'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'img/marca/favicon-32.png'), path.join(OUT, 'favicon.ico'));

const urls = pages.filter(p => !p.ruta.endsWith('.html')).map(p => `${sitio.dominio}/${p.ruta}`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), BORRADOR ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${sitio.dominio}/sitemap.xml\n`);

// redirecciones desde las direcciones del sitio anterior
const antiguas = [
  ...productos.filter(p => p.urlAntigua).map(p => [p.urlAntigua, `/productos/${slug(p)}/`]),
  ...(sitio.redireccionesExtra || []),
  ['/pack-3-bandeja-mini-chilenito-12-un', '/productos/'],
  ['/en/bandeja-galletitas-para-mini-alfajores', '/productos/'],
  ['/dolccezza', '/productos/'],
  ['/lidercl', '/contacto/#donde-comprar']
];
// Netlify / Cloudflare Pages
fs.writeFileSync(path.join(OUT, '_redirects'), [...antiguas.map(([a, b]) => `${a} ${b} 301`), '/en / 301', '/en/* /productos/ 301'].join('\n') + '\n');
// Apache (hosting con cPanel)
const host = new URL(sitio.dominio).host;
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/^\//, '');
fs.writeFileSync(path.join(OUT, '.htaccess'), `# Generado por build.mjs: no editar a mano
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html
AddDefaultCharset UTF-8
AddType image/webp .webp

<IfModule mod_rewrite.c>
RewriteEngine On
# HTTPS y ${host}, salvo en la validación de certificados de cPanel
RewriteCond %{REQUEST_URI} !^/\\.well-known/
RewriteCond %{HTTPS} off [OR]
RewriteCond %{HTTP_HOST} !^${host.replace(/\./g, '\\.')}$ [NC]
RewriteRule ^(.*)$ https://${host}/$1 [R=301,L]

# Direcciones del sitio anterior
${antiguas.map(([a, b]) => `RewriteRule ^${reEsc(a)}/?$ ${b.replace('#', '\\#')} [R=301,L,NE]`).join('\n')}
RewriteRule ^en/?$ / [R=301,L]
RewriteRule ^en/.+ /productos/ [R=301,L]
</IfModule>

<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml text/xml text/plain
</IfModule>

<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/html "access plus 0 seconds"
ExpiresByType text/css "access plus 1 week"
ExpiresByType application/javascript "access plus 1 week"
ExpiresByType image/webp "access plus 1 month"
ExpiresByType image/png "access plus 1 month"
ExpiresByType image/jpeg "access plus 1 month"
</IfModule>
`);

// paquete para subir por el administrador de archivos de cPanel
if (process.argv.includes('--zip')) {
  const { execFileSync } = await import('node:child_process');
  const zip = path.join(ROOT, 'entrega', 'casacake-sitio.zip');
  fs.mkdirSync(path.dirname(zip), { recursive: true });
  fs.rmSync(zip, { force: true });
  execFileSync('zip', ['-r', '-q', '-X', zip, '.', '-x', '_redirects'], { cwd: OUT });
  console.log('Paquete para cPanel:', path.relative(ROOT, zip));
}

console.log(`Sitio generado en dist/ (${pages.length} páginas${BORRADOR ? ', modo borrador' : ''}${LOCAL ? ', enlaces locales' : ''}).`);
if (pendientes.length) {
  console.log(`\nDatos pendientes (${pendientes.length}):`);
  for (const m of pendientes) console.log('  - ' + m);
}
