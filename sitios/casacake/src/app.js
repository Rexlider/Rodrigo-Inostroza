// Casacake: lista de consulta, filtros del catálogo y envío por WhatsApp o correo.
(() => {
  const CC = JSON.parse(document.getElementById('cc-datos').textContent);
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const byCode = c => CC.productos.find(p => p.codigo === c);
  const KEY = 'casacake-lista';

  const waLink = (num, text) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  const mailLink = (to, subject, text) => `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* menú móvil */
  const menuBtn = $('#menu-btn'), nav = $('#nav');
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });

  /* copiar código */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy-text]'); if (!b) return;
    const text = b.dataset.copyText;
    const ok = () => toast(`Código ${text} copiado`);
    try { navigator.clipboard.writeText(text).then(ok, () => toast(text)); } catch { toast(text); }
  });

  /* lista de consulta */
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(KEY)) || []; } catch { lista = []; }
  lista = lista.filter(l => byCode(l.codigo));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(lista)); } catch {} };
  const count = () => $$('[data-list-count]').forEach(el => el.textContent = lista.reduce((a, l) => a + l.qty, 0));
  count();

  document.addEventListener('click', e => {
    const step = e.target.closest('[data-step]');
    if (step) {
      const inp = step.parentElement.querySelector('input');
      inp.value = Math.max(1, (+inp.value || 1) + +step.dataset.step);
      return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      const p = byCode(add.dataset.add);
      const inp = document.getElementById('qty-' + p.codigo);
      const qty = Math.max(1, Math.round(+(inp?.value) || 1));
      const l = lista.find(x => x.codigo === p.codigo);
      l ? l.qty += qty : lista.push({ codigo: p.codigo, qty });
      save(); count(); toast(`Agregado a tu lista: ${qty} × ${p.nombre}`);
    }
  });

  const drawer = $('#lista');
  $$('[data-open-list]').forEach(b => b.addEventListener('click', () => { render(); drawer.showModal(); }));
  $('#lista-x')?.addEventListener('click', () => drawer.close());
  drawer?.addEventListener('click', e => { if (e.target === drawer) drawer.close(); });

  function listText() {
    const nombre = $('#l-nombre')?.value.trim(), comuna = $('#l-comuna')?.value.trim();
    return [`Hola ${CC.nombre}, quiero consultar por estos productos:`,
      ...lista.map(l => { const p = byCode(l.codigo); return `- ${l.qty} × ${p.codigo} ${p.nombre} (${p.formato.toLowerCase()}, ${p.unidades} un)`; }),
      nombre && `Nombre: ${nombre}`, comuna && `Comuna: ${comuna}`].filter(Boolean).join('\n');
  }
  function render() {
    const body = $('#lista-body'), foot = $('#lista-foot');
    if (!lista.length) {
      body.innerHTML = `<p class="muted">Tu lista está vacía. Agrega productos desde el catálogo y envíala al vendedor en un solo mensaje.</p>`;
      foot.innerHTML = `<a class="btn btn-ink" href="${CC.urlCatalogo}">Ver catálogo</a>`;
      return;
    }
    body.innerHTML = lista.map((l, i) => { const p = byCode(l.codigo); return `
      <div class="line">
        <div><span class="code">${p.codigo}</span><b>${p.nombre}</b><button class="rm" type="button" data-rm="${i}">Quitar</button></div>
        <div class="stepper"><button type="button" data-lstep="-1" data-i="${i}" aria-label="Menos">−</button><input type="number" value="${l.qty}" data-lq="${i}" aria-label="Cantidad de ${p.nombre}"><button type="button" data-lstep="1" data-i="${i}" aria-label="Más">+</button></div>
      </div>`; }).join('') + `
      <div class="field"><label for="l-nombre">Tu nombre (opcional)</label><input id="l-nombre" autocomplete="name"></div>
      <div class="field"><label for="l-comuna">Comuna (opcional)</label><input id="l-comuna"></div>
      ${CC.vendedores.length > 1 ? `<div class="field"><label for="l-vend">Vendedor</label><select id="l-vend">${CC.vendedores.map((v, i) => `<option value="${i}">${v.zona}${v.nombre ? ' · ' + v.nombre : ''}</option>`).join('')}</select></div>` : ''}`;
    const canWa = CC.vendedores.some(v => v.whatsapp);
    foot.innerHTML = `
      <button class="btn btn-wa" type="button" id="l-send" ${canWa ? '' : 'disabled'}>Enviar por WhatsApp</button>
      ${CC.correo ? `<button class="btn btn-ghost" type="button" id="l-mail">Enviar por correo</button>` : ''}
      ${canWa ? '' : '<p class="pend">Falta el número de WhatsApp del vendedor.</p>'}`;
  }
  drawer?.addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { lista.splice(+rm.dataset.rm, 1); save(); count(); render(); return; }
    const ls = e.target.closest('[data-lstep]');
    if (ls) { const l = lista[+ls.dataset.i]; l.qty = Math.max(1, l.qty + +ls.dataset.lstep); save(); count(); render(); return; }
    if (e.target.closest('#l-send')) {
      const v = CC.vendedores[+($('#l-vend')?.value || 0)] || CC.vendedores.find(x => x.whatsapp);
      window.open(waLink(v.whatsapp, listText()), '_blank', 'noopener');
    }
    if (e.target.closest('#l-mail')) location.href = mailLink(CC.correo, 'Consulta de productos', listText());
  });
  drawer?.addEventListener('change', e => {
    if (!e.target.dataset.lq) return;
    lista[+e.target.dataset.lq].qty = Math.max(1, Math.round(+e.target.value || 1)); save(); count(); render();
  });

  /* catálogo: filtros y búsqueda */
  const grid = $('#catalogo');
  if (grid) {
    const cards = $$('#catalogo .card');
    const q = $('#q');
    const params = new URLSearchParams(location.search);
    let cat = params.get('cat') || 'todo';
    if (!$(`.chip[data-cat="${cat}"]`)) cat = 'todo';
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    function apply() {
      const term = norm(q.value.trim());
      let shown = 0;
      cards.forEach(c => {
        const ok = (cat === 'todo' || c.dataset.cat === cat) && (!term || norm(c.dataset.search).includes(term));
        c.hidden = !ok; if (ok) shown++;
      });
      $$('.chip[data-cat]').forEach(ch => ch.setAttribute('aria-pressed', ch.dataset.cat === cat));
      $('#sin-resultados').hidden = shown > 0;
    }
    $$('.chip[data-cat]').forEach(ch => ch.addEventListener('click', e => {
      e.preventDefault(); cat = ch.dataset.cat;
      const u = new URL(location.href); cat === 'todo' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat);
      history.replaceState(null, '', u); apply();
    }));
    q.addEventListener('input', apply);
    apply();
  }

  /* galería de fotos de la ficha */
  $$('.thumbs button').forEach(b => b.addEventListener('click', () => {
    const main = b.closest('.gallery').querySelector('.art img.photo');
    if (main) main.src = b.dataset.foto;
    $$('.thumbs button').forEach(x => x.setAttribute('aria-current', x === b));
  }));

  /* formulario empresas */
  const b2b = $('#b2b');
  if (b2b) {
    b2b.addEventListener('submit', e => e.preventDefault());
    const build = () => {
      const f = b2b.elements;
      const prods = $$('#b2b input[name=prod]:checked').map(i => i.value);
      if (!f.nombre.value.trim()) return { err: 'Indica tu nombre.' };
      if (!prods.length) return { err: 'Elige al menos un producto.' };
      return { text: [`Hola ${CC.nombre}, quiero una propuesta para empresas.`,
        `Nombre: ${f.nombre.value.trim()}`, f.empresa.value.trim() && `Empresa: ${f.empresa.value.trim()} (${f.tipo.value})`,
        f.comuna.value.trim() && `Ciudad: ${f.comuna.value.trim()}`, f.tel.value.trim() && `Teléfono: ${f.tel.value.trim()}`,
        `Productos: ${prods.join(', ')}`, `Bandejas al mes: ${f.vol.value}`, `Frecuencia: ${f.frec.value}`,
        f.msg.value.trim() && `Detalles: ${f.msg.value.trim()}`].filter(Boolean).join('\n') };
    };
    b2b.addEventListener('click', e => {
      const b = e.target.closest('[data-send]'); if (!b) return;
      const r = build();
      $('#b2b-err').textContent = r.err || '';
      if (r.err) return;
      if (b.dataset.send === 'wa') window.open(waLink(CC.vendedores.find(v => v.whatsapp).whatsapp, r.text), '_blank', 'noopener');
      else location.href = mailLink(CC.correo, 'Propuesta para empresas', r.text);
    });
  }
})();
