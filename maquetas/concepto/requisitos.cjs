// Genera documentos/Requisitos-Sitios-Agrotrade-Casacake.pdf: formulario con todo lo necesario para crear ambos sitios.
// Uso: npm install && node requisitos.cjs
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const DIR = __dirname;
const OUT_DIR = path.join(DIR, '..', '..', 'documentos');
const OUT = path.join(OUT_DIR, 'Requisitos-Sitios-Agrotrade-Casacake.pdf');
const FONTS = path.join(DIR, 'node_modules', '@fontsource');
const FECHA = '24 de octubre de 2026';

const fontFaces = [['bricolage-grotesque', 'Bricolage Grotesque', [700, 800]], ['public-sans', 'Public Sans', [400, 600, 700]], ['ibm-plex-mono', 'IBM Plex Mono', [400, 500]]]
  .map(([pkg, fam, ws]) => ws.map(w => `@font-face{font-family:"${fam}";font-weight:${w};src:url("file://${path.join(FONTS, pkg, 'files', `${pkg}-latin-${w}-normal.woff2`)}") format("woff2")}`).join('\n')).join('\n');

/* ---------- contenido ---------- */
// p: A = imprescindible para publicar · B = necesario para el sitio completo · C = puede ir después
const lines = n => ({ lines: n });
const opts = (...o) => ({ opts: o });
const table = (cols, rows, blank = 0, widths) => ({ table: { cols, rows, blank, widths } });

const CC_PRODUCTOS = [
  ['CC-TAC-050', 'Tacita cóctel neutra · bandeja 50 un', '$4.500'],
  ['CC-TAC-150', 'Tacita cóctel neutra · pack 3 (150 un)', '$14.900'],
  ['CC-TAR-072', 'Mini tartaleta flor cóctel · pack 3 (72 un)', '$14.900'],
  ['CC-CAC-090', 'Cachito cóctel · pack 3 (90 un)', '$14.900'],
  ['CC-HOJ-060', 'Hojarasca cóctel · bandeja 60 tapitas', '$4.500 / $3.600'],
  ['CC-CHI-036', 'Mini chilenito · pack 3 (36 un)', '$10.490 (agotado)'],
  ['CC-ALF-110', 'Galletitas para mini alfajores · pack 3 (110 un)', 'No visible'],
  ['CC-CHM-006', 'Chilenos rellenos de manjar · caja 6 un', '$2.500–$2.790'],
  ['CC-CHE-006', 'Chilenos con manjar y merengue · caja 6 un', '$2.500–$2.790']
];
const AT_PRODUCTOS = [
  ['Maíz molido (fino o grueso)', 'Saco 25 kg', '10 sacos'],
  ['Avena forrajera', 'Saco 25 kg', '20 sacos'],
  ['Harina de soya 48 % proteína', 'Saco 50 kg', '5 sacos'],
  ['Pellet de girasol', '', '']
];

const SECTIONS = [
  {
    id: 'comun', letter: '1', title: 'Para ambos sitios', tone: 'ink',
    intro: 'Accesos y decisiones que sirven para los dos sitios. Lo ideal es que las cuentas queden a nombre de la empresa o de la familia, y que yo tenga acceso como colaborador.',
    groups: [
      { title: 'Dominios y correo', items: [
        { p: 'A', t: 'Acceso a NIC Chile para casacake.cl y agrotrade.cl', d: 'Usuario titular de cada dominio. Si prefieren no compartir la clave, el titular hace el cambio de DNS conmigo en una llamada guiada de 15 minutos.', fill: table(['Dominio', 'Titular (nombre o RUT)', 'Quién tiene la clave'], [['casacake.cl', '', ''], ['agrotrade.cl', '', '']], 0, ['24%', '40%', '36%']) },
        { p: 'A', t: 'Dónde están hoy los correos @agrotrade.cl y @casacake.cl', d: 'Por ejemplo Google Workspace, Outlook o el hosting actual. Hay que conservarlos al cambiar el sitio para no cortar el correo.', fill: opts('Google Workspace', 'Microsoft / Outlook', 'En el hosting actual', 'No usamos correo con el dominio', 'No sé') },
        { p: 'A', t: 'Acceso al sitio y hosting actuales', d: 'Para respaldar fotos y textos antes del cambio. agrotrade.cl parece estar hecho en WordPress con WooCommerce; casacake.cl, en una plataforma de tiendas. Indiquen cuál es y quién la administra.', fill: lines(2) }
      ] },
      { title: 'Cuentas y publicación', items: [
        { p: 'A', t: 'Aprobar dónde se publican los sitios', d: 'Recomiendo Cloudflare Pages: no tiene costo mensual de hosting y aguanta bien el tráfico. Se crea una cuenta con el correo de la empresa y me invitan como colaborador.', fill: opts('Cloudflare Pages (recomendado)', 'Netlify', 'Otro: ____________') },
        { p: 'A', t: 'Cuenta de GitHub para guardar el código', d: 'El código de cada sitio queda en un repositorio propio (casacake-web y agrotrade-web). Puede ser una cuenta de la empresa o la de Rodrigo.', fill: opts('Usar la cuenta de Rodrigo', 'Crear una cuenta de la empresa') },
        { p: 'B', t: 'Cuenta de Google para Search Console, Analytics y Google Business', d: 'Sirve para que los sitios aparezcan en Google y Maps, y para medir visitas. Indiquen el correo de la cuenta.', fill: lines(1) },
        { p: 'B', t: 'Quién actualiza precios, stock y productos', d: 'Una persona por marca que me avise los cambios (o que aprenda a editarlos; son dos archivos de texto).', fill: table(['Marca', 'Nombre', 'Teléfono o correo'], [['Casacake', '', ''], ['Agrotrade', '', '']], 0, ['24%', '38%', '38%']) },
        { p: 'B', t: 'Datos legales que deben aparecer en ambos sitios', d: 'La Ley del Consumidor pide identificar al proveedor: razón social, RUT y dirección. Conviene revisarlo con su contador.', fill: table(['Marca', 'Razón social', 'RUT', 'Dirección comercial'], [['Casacake', 'Casacake SpA', '', ''], ['Agrotrade', '', '', '']], 0, ['16%', '28%', '18%', '38%']) }
      ] }
    ]
  },
  {
    id: 'casacake', letter: '2', title: 'Casacake · catálogo con contacto directo', tone: 'berry',
    intro: 'Sitio estilo pidy.com: catálogo con código propio por producto, ficha técnica y consulta directa al vendedor por WhatsApp. No tiene pago en línea. El sitio ya está construido en borrador; falta llenarlo con los datos reales.',
    groups: [
      { title: 'Para publicar', items: [
        { p: 'A', t: 'WhatsApp de cada vendedor', d: 'Los botones de consulta abren un chat con este número. Si hay varios vendedores, el cliente elige por zona.', fill: table(['Nombre del vendedor', 'Zona o tipo de cliente', 'WhatsApp (+56 9 …)'], [], 3, ['36%', '32%', '32%']) },
        { p: 'A', t: 'Correo de ventas', d: 'Para el formulario de empresas y el pie de página.', fill: lines(1) },
        { p: 'A', t: 'Confirmar que los productos están vigentes', d: 'Marquen los que siguen a la venta. Agreguen abajo los que falten en la lista.', fill: table(['Código propuesto', 'Producto', 'Vigente'], CC_PRODUCTOS.map(([c, n]) => [c, n, '☐ Sí   ☐ No']), 3, ['22%', '56%', '22%']) }
      ] },
      { title: 'Catálogo y precios', items: [
        { p: 'B', t: 'Códigos de producto', d: 'Propuse el formato CC + familia + unidades (por ejemplo CC-TAC-050). Si ya usan códigos internos o de Lider, anótenlos en la tabla de fichas técnicas.', fill: opts('Usar los códigos propuestos', 'Usar nuestros códigos internos') },
        { p: 'B', t: '¿Se muestran los precios en el catálogo?', d: 'Pidy no los muestra y todo se conversa con el vendedor. Si se muestran, hay que confirmarlos.', fill: opts('No mostrar precios (como Pidy)', 'Mostrar precios de referencia') },
        { p: 'B', t: 'Precios confirmados (solo si se muestran)', d: 'El pack de 3 tacitas sale más caro que 3 bandejas sueltas y la hojarasca aparece con dos precios en el sitio actual.', fill: table(['Código', 'Precio en el sitio actual', 'Precio correcto'], CC_PRODUCTOS.map(([c, , pr]) => [c, pr, '']), 0, ['26%', '37%', '37%']) },
        { p: 'B', t: 'Ficha técnica de cada producto', d: 'Como en Pidy: lo que esté en la etiqueta o la ficha del producto. Lo que no tengan se deja en blanco y no aparece.', fill: table(['Código', 'Código interno', 'Medidas (Ø × alto)', 'Peso por unidad', 'Duración', 'Conservación', 'Código de barras'], CC_PRODUCTOS.map(([c]) => [c, '', '', '', '', '', '']), 0, ['15%', '13%', '15%', '12%', '13%', '15%', '17%']) },
        { p: 'B', t: 'Fotos de cada producto', d: 'Tres por producto: envase con etiqueta, producto fuera del envase visto desde arriba y producto relleno o servido. Ver la guía de fotos al final.', fill: opts('Las tenemos', 'Hay que sacarlas', 'Necesitamos fotógrafo') },
        { p: 'B', t: 'Logo', d: 'Archivo vectorial (AI, SVG o PDF) o PNG de al menos 1000 px con fondo transparente. Indiquen si quieren mantenerlo o rediseñarlo.', fill: opts('Mantener el actual', 'Rediseñar') }
      ] },
      { title: 'Empresa y ventas', items: [
        { p: 'B', t: 'Dirección, horario y si se puede retirar', d: 'Hoy hay datos que dicen Rancagua y otros que dicen Santiago. Indiquen la dirección oficial.', fill: lines(2) },
        { p: 'B', t: 'Condiciones para empresas y mayoristas', d: 'Mínimo de compra, descuentos por volumen, zonas y días de despacho.', fill: lines(3) },
        { p: 'B', t: 'Dónde más se venden los productos', d: 'Hoy encontré Lider, Falabella, Mercado Libre y Uber Eats. Marquen los que deben aparecer en el sitio.', fill: opts('Lider', 'Falabella', 'Mercado Libre', 'Uber Eats', 'Otros: ____________') },
        { p: 'B', t: 'Historia de la familia y de Casacake', d: 'Uno o dos párrafos: cómo empezó, desde cuándo, dónde está la planta. Puede ser un audio de WhatsApp y yo lo redacto.', fill: lines(3) },
        { p: 'C', t: 'Redes sociales', d: 'Instagram, Facebook, TikTok u otras que quieran enlazar.', fill: lines(1) },
        { p: 'C', t: 'Recetas o ideas de relleno propias', d: 'Si tienen recetas o fotos de productos rellenos, se suman a la sección de ideas.', fill: lines(1) }
      ] }
    ]
  },
  {
    id: 'agrotrade', letter: '3', title: 'Agrotrade · tienda por saco y por volumen', tone: 'field',
    intro: 'Tienda como en la maqueta: compra por saco con mínimo por producto, carro con peso total, confirmación de flete por WhatsApp y formulario de cotización por volumen.',
    groups: [
      { title: 'Para publicar', items: [
        { p: 'A', t: 'Precio y compra mínima de cada producto', d: 'Precio por saco, puesto en bodega, sin flete. Confirmen también el mínimo y agreguen los productos que falten.', fill: table(['Producto', 'Formato', 'Mínimo actual', 'Mínimo correcto', 'Precio por saco'], AT_PRODUCTOS.map(r => [...r, '', '']), 3, ['30%', '15%', '17%', '18%', '20%']) },
        { p: 'A', t: 'Ficha del pellet de girasol', d: 'Aparece en el sitio actual sin ficha propia.', fill: table(['Formato (kg)', 'Proteína (%)', 'Compra mínima', 'Uso recomendado'], [['', '', '', '']], 0, ['22%', '20%', '22%', '36%']) },
        { p: 'A', t: 'WhatsApp para pedidos', d: 'Recibe los pedidos y se usa para confirmar flete y fecha.', fill: lines(1) },
        { p: 'A', t: 'Correo para pedidos', d: 'Hoy figura rinostroza@agrotrade.cl. Confirmen si sigue o si usamos otro.', fill: opts('Seguir con rinostroza@agrotrade.cl', 'Usar otro: ____________________') },
        { p: 'A', t: 'Dirección y horario de la bodega de retiro', d: 'Aparece en el checkout, en el pie de página y en Google Maps.', fill: lines(2) },
        { p: 'A', t: 'Forma de pago', d: 'Para partir recomiendo solo transferencia: no requiere contrato ni comisiones. El pago con tarjeta pide contratar Webpay, Mercado Pago o Flow, con cuenta bancaria de la empresa, y cobra comisión por venta.', fill: opts('Solo transferencia (recomendado)', 'Agregar tarjeta con Webpay', 'Agregar Mercado Pago', 'Agregar Flow') }
      ] },
      { title: 'Despacho y ventas por volumen', items: [
        { p: 'B', t: 'Zonas y costo de despacho', d: 'Comunas a las que llegan y cómo se cobra el flete. Si se cotiza caso a caso, el sitio lo dice así.', fill: table(['Zona o comunas', 'Costo (por envío, por kg o por saco)', 'Mínimo para despacho'], [], 4, ['40%', '35%', '25%']) },
        { p: 'B', t: 'Condiciones por volumen', d: 'Descuentos por tonelada, por camión completo o por compra mensual; plazos de pago para clientes frecuentes.', fill: lines(3) },
        { p: 'B', t: 'Boleta y factura', d: 'Si emiten factura, el checkout pide RUT y giro del cliente.', fill: opts('Solo boleta', 'Boleta y factura', 'Solo factura') },
        { p: 'B', t: 'Condiciones de venta', d: 'Cambios, devoluciones y derecho a retracto. En ventas a distancia la ley da 10 días de retracto, salvo que el sitio lo excluya de forma expresa. Revísenlo con su contador o abogado.', fill: opts('Aceptamos retracto', 'Excluimos el retracto', 'Lo revisaremos') }
      ] },
      { title: 'Contenido', items: [
        { p: 'B', t: 'Ficha técnica de cada producto', d: 'Proteína, humedad, origen, para qué animales. Si tienen análisis de laboratorio, mejor.', fill: table(['Producto', 'Proteína', 'Humedad', 'Origen', 'Uso (animal o etapa)'], AT_PRODUCTOS.map(([n]) => [n, '', '', '', '']), 2, ['30%', '14%', '14%', '17%', '25%']) },
        { p: 'B', t: 'Fotos', d: 'Saco con la etiqueta visible, el grano de cerca, la bodega y el camión de despacho. Ver la guía al final.', fill: opts('Las tenemos', 'Hay que sacarlas') },
        { p: 'B', t: 'Logo', d: 'Mismo formato que Casacake: vectorial o PNG con fondo transparente.', fill: opts('Mantener el actual', 'Rediseñar') },
        { p: 'B', t: 'Historia de la familia y de Agrotrade', d: 'Uno o dos párrafos o un audio: desde cuándo, a quién le venden, de dónde vienen los productos.', fill: lines(3) },
        { p: 'C', t: 'Clientes que quieran recomendarlos', d: 'Nombre del predio o lechería y una frase, con su autorización.', fill: lines(2) },
        { p: 'C', t: 'Redes sociales', d: 'Si tienen o piensan abrir alguna.', fill: lines(1) }
      ] }
    ]
  }
];

/* ---------- render ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const PRIO = { A: 'Para publicar', B: 'Sitio completo', C: 'Puede ir después' };
function renderFill(f) {
  if (!f) return '';
  if (f.lines) return `<div class="write">${'<div></div>'.repeat(f.lines)}</div>`;
  if (f.opts) return `<div class="opts">${f.opts.map(o => `<span><i></i>${esc(o)}</span>`).join('')}</div>`;
  const t = f.table;
  const cg = t.widths ? `<colgroup>${t.widths.map(w => `<col style="width:${w}">`).join('')}</colgroup>` : '';
  const rows = t.rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 && c ? ' class="k"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')
    + `<tr class="blank">${t.cols.map(() => '<td></td>').join('')}</tr>`.repeat(t.blank);
  return `<table>${cg}<thead><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}
let n = 0, total = 0;
const counts = {};
const body = SECTIONS.map(s => {
  counts[s.id] = { A: 0, B: 0, C: 0 };
  n = 0;
  return `<section class="sec t-${s.tone}">
    <header class="sec-h"><span class="num">${s.letter}</span><div><h2>${esc(s.title)}</h2><p>${esc(s.intro)}</p></div></header>
    ${s.groups.map(g => {
      const items = g.items.map(it => {
        n++; total++; counts[s.id][it.p]++;
        return `<div class="it"><span class="box"></span><div class="it-b"><div class="it-h"><span class="id">${s.letter}.${String(n).padStart(2, '0')}</span><b>${esc(it.t)}</b><span class="prio p${it.p}">${it.p} · ${PRIO[it.p]}</span></div><p class="d">${esc(it.d)}</p>${renderFill(it.fill)}</div></div>`;
      });
      // el título del grupo nunca queda solo al final de una página
      return `<div class="keep"><h3>${esc(g.title)}</h3>${items[0]}</div>${items.slice(1).join('')}`;
    }).join('')}
  </section>`;
}).join('');

const tot = k => SECTIONS.reduce((a, s) => a + counts[s.id][k], 0);
const resumen = `<table class="sum"><thead><tr><th>Sección</th><th class="n">A · Para publicar</th><th class="n">B · Sitio completo</th><th class="n">C · Después</th></tr></thead><tbody>
  ${SECTIONS.map(s => `<tr><td>${s.letter}. ${esc(s.title)}</td><td class="n">${counts[s.id].A}</td><td class="n">${counts[s.id].B}</td><td class="n">${counts[s.id].C}</td></tr>`).join('')}
  <tr class="tot"><td>Total</td><td class="n">${tot('A')}</td><td class="n">${tot('B')}</td><td class="n">${tot('C')}</td></tr></tbody></table>`;

const cover = `<section class="cover">
  <p class="eyebrow">Sitios web familiares · agrotrade.cl y casacake.cl</p>
  <h1>Lo que necesito para crear los dos sitios</h1>
  <p class="lede">Formulario para reunir los datos, accesos y decisiones que faltan. Se puede llenar a mano, o responder por WhatsApp o correo citando el número de cada punto (por ejemplo «2.04»).</p>
  <div class="meta"><span><b>Fecha</b>${FECHA}</span><span><b>Coordina</b>Rodrigo Inostroza</span><span><b>Contacto</b>rodrigo.ignacio.inostroza.p@gmail.com</span></div>
  <div class="cols">
    <div class="card t-berry"><p class="eyebrow">Casacake</p><h3>Catálogo con contacto directo</h3><p>Productos con código propio y ficha técnica; el cliente consulta por WhatsApp. <b>Estado:</b> sitio construido en borrador.</p></div>
    <div class="card t-field"><p class="eyebrow">Agrotrade</p><h3>Tienda por saco y por volumen</h3><p>Compra mínima por producto, flete confirmado por WhatsApp y cotización por volumen. <b>Estado:</b> diseño aprobado, falta construirlo.</p></div>
  </div>
  <h3 class="mt">Cómo leer este documento</h3>
  <div class="legend">
    <div><span class="prio pA">A · Para publicar</span><p>Sin esto el sitio no puede salir al aire.</p></div>
    <div><span class="prio pB">B · Sitio completo</span><p>Se puede publicar sin esto y agregarlo en las semanas siguientes.</p></div>
    <div><span class="prio pC">C · Puede ir después</span><p>Mejora el sitio, pero no es urgente.</p></div>
  </div>
  <h3 class="mt">Resumen</h3>
  ${resumen}
  <p class="note">Orden sugerido: puntos A de la sección 1, luego los de Casacake para publicarlo primero, y después Agrotrade. Los datos que ya conozco del sitio actual vienen escritos para que solo tengan que confirmarlos.</p>
</section>`;

const guia = `<section class="sec t-ink guide">
  <header class="sec-h"><span class="num">4</span><div><h2>Guía rápida de fotos</h2><p>Con un celular reciente basta. Lo importante es la luz y que todas las fotos se vean parecidas.</p></div></header>
  <div class="cols">
    <div><h3>Cómo sacarlas</h3><ul>
      <li>Luz natural de día, cerca de una ventana, sin flash.</li>
      <li>Fondo liso y claro: mesa blanca, cartulina o madera clara. El mismo en todas.</li>
      <li>Celular en horizontal, sin filtros ni zoom digital.</li>
      <li>Una foto desde arriba y otra en ángulo de 45°.</li>
      <li>Enviar el archivo original (por correo o Google Drive; WhatsApp reduce la calidad).</li>
      <li>Nombrar cada archivo con el código del producto, por ejemplo <span class="mono">CC-TAC-050-1.jpg</span>.</li>
    </ul></div>
    <div><h3>Qué fotografiar</h3>
      <p><b>Casacake</b>, por producto:</p><ul><li>Envase cerrado con la etiqueta visible.</li><li>Bandeja abierta, vista desde arriba.</li><li>Producto relleno o servido.</li></ul>
      <p class="mt-s"><b>Agrotrade</b>:</p><ul><li>Cada saco con la etiqueta visible.</li><li>El grano o pellet de cerca, en la mano o en un plato.</li><li>La bodega y el camión de despacho.</li></ul>
    </div>
  </div>
  <div class="sign">
    <div><span>Revisado por</span><div class="line"></div></div>
    <div><span>Fecha</span><div class="line"></div></div>
  </div>
</section>`;

const CSS = `${fontFaces}
@page{size:A4;margin:18mm 15mm 16mm}
*{box-sizing:border-box}
:root{--ink:#1D1B1A;--muted:#6B6460;--line:#DDD6D2;--soft:#F6F3F1;--berry:#C3345A;--berry-soft:#FBE6EC;--field:#24452F;--field-soft:#E5EEE6;--straw:#B98600;--pa:#B4232F;--pa-bg:#FBE9EA;--pb:#8A5A00;--pb-bg:#FBF1DC;--pc:#4F6170;--pc-bg:#E9EEF2}
body{margin:0;color:var(--ink);font:9.6pt/1.45 "Public Sans",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1,h2,h3{font-family:"Bricolage Grotesque",Arial,sans-serif;margin:0;line-height:1.08;letter-spacing:-.015em}
p{margin:0}
.eyebrow{font:500 7.5pt/1.2 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.mono{font-family:"IBM Plex Mono",monospace;font-size:.92em}
.cover{break-after:page}
.cover h1{font-size:30pt;font-weight:800;margin-top:6mm;max-width:150mm}
.cover .lede{font-size:11.5pt;color:var(--muted);margin-top:5mm;max-width:155mm}
.cover .meta{display:flex;gap:9mm;margin-top:7mm;font:400 8pt/1.4 "IBM Plex Mono",monospace;color:var(--muted)}
.cover .meta b{display:block;color:var(--ink);font-weight:500}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:8mm}
.card{border-radius:3mm;padding:5mm;border:.3mm solid var(--line)}
.card h3{font-size:13pt;margin:1.5mm 0 2mm}
.card.t-berry{background:var(--berry-soft);border-color:transparent}.card.t-berry .eyebrow{color:var(--berry)}
.card.t-field{background:var(--field-soft);border-color:transparent}.card.t-field .eyebrow{color:var(--field)}
.mt{margin-top:9mm}.mt-s{margin-top:3mm}
.cover h3{font-size:12pt}
.legend{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:3mm}
.legend p{color:var(--muted);margin-top:2mm;font-size:9pt}
.prio{display:inline-block;font:500 7pt/1 "IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;padding:1.2mm 2mm;border-radius:1mm;white-space:nowrap}
.pA{color:var(--pa);background:var(--pa-bg)}.pB{color:var(--pb);background:var(--pb-bg)}.pC{color:var(--pc);background:var(--pc-bg)}
table{width:100%;border-collapse:collapse;margin-top:2.5mm;font-size:8.6pt;table-layout:fixed}
th{font:500 6.8pt/1.25 "IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left;padding:1.6mm 2mm;border-bottom:.4mm solid var(--ink);vertical-align:bottom}
td{padding:1.6mm 2mm;border:.25mm solid var(--line);height:8mm;vertical-align:middle}
td.k{font-family:"IBM Plex Mono",monospace;font-size:7.8pt}
tr.blank td{height:8mm}
.sum{margin-top:3mm;font-size:9.5pt}
.sum td{height:auto;border-width:0 0 .25mm 0;padding:2mm}
.sum .n{text-align:right;font-family:"IBM Plex Mono",monospace}
.sum tr.tot td{font-weight:700;border-bottom:0}
.note{font-size:9pt;color:var(--muted);margin-top:5mm}
.sec{break-before:page}
.cover+.sec{break-before:auto}
.sec-h{display:grid;grid-template-columns:13mm 1fr;gap:4mm;align-items:start;padding-bottom:4mm;border-bottom:.6mm solid var(--tone);margin-bottom:2mm}
.sec-h .num{width:13mm;height:13mm;border-radius:50%;background:var(--tone);color:#fff;display:grid;place-items:center;font:800 15pt/1 "Bricolage Grotesque",sans-serif}
.sec-h h2{font-size:19pt;font-weight:800;color:var(--tone)}
.sec-h p{color:var(--muted);margin-top:1.5mm;max-width:160mm}
.t-ink{--tone:var(--ink)}.t-berry{--tone:var(--berry)}.t-field{--tone:var(--field)}
.sec h3{font-size:11.5pt;margin:6mm 0 1mm;color:var(--tone)}
.keep{break-inside:avoid}
.it{display:grid;grid-template-columns:6mm 1fr;gap:3mm;padding:3.4mm 0;border-bottom:.25mm solid var(--line);break-inside:avoid}
.box{width:4.4mm;height:4.4mm;border:.4mm solid var(--ink);border-radius:.8mm;margin-top:.4mm}
.it-h{display:flex;align-items:baseline;gap:2.5mm;flex-wrap:wrap}
.it-h .id{font:500 7.8pt/1 "IBM Plex Mono",monospace;color:var(--muted)}
.it-h b{font-size:10.2pt;flex:1;min-width:60mm}
.d{color:var(--muted);margin-top:1mm;font-size:9pt}
.write div{height:7.5mm;border-bottom:.3mm dotted #9C9490}
.opts{display:flex;flex-wrap:wrap;gap:2mm 6mm;margin-top:2.5mm;font-size:9pt}
.opts span{display:inline-flex;align-items:center;gap:1.8mm}
.opts i{width:3.6mm;height:3.6mm;border:.35mm solid var(--ink);border-radius:50%;display:inline-block}
.guide ul{margin:2mm 0 0;padding-left:4.5mm;display:grid;gap:1.4mm}
.guide .cols{margin-top:4mm}
.guide h3{margin-top:0}
.sign{display:grid;grid-template-columns:2fr 1fr;gap:10mm;margin-top:16mm}
.sign span{font:500 7.5pt/1 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.sign .line{height:12mm;border-bottom:.35mm solid var(--ink)}
`;

const header = `<div style="width:100%;padding:0 15mm;font:7pt Arial,sans-serif;color:#8A827E;display:flex;justify-content:space-between"><span>Requisitos · sitios web agrotrade.cl y casacake.cl</span><span>${FECHA}</span></div>`;
const footer = `<div style="width:100%;padding:0 15mm;font:7pt Arial,sans-serif;color:#8A827E;display:flex;justify-content:space-between"><span>Responder citando el número de cada punto</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Requisitos sitios web</title><style>${CSS}</style></head><body>${cover}${body}${guia}</body></html>`;
  const tmp = path.join(DIR, 'capturas', 'requisitos.html');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  const p = await browser.newPage();
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: OUT, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: header, footerTemplate: footer, margin: { top: '18mm', bottom: '16mm', left: '15mm', right: '15mm' } });
  await browser.close();
  console.log('Listo:', path.relative(process.cwd(), OUT), `(${total} puntos: A ${tot('A')}, B ${tot('B')}, C ${tot('C')})`);
})();
