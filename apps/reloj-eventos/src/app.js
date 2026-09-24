/*
 * Reloj de Eventos — interfaz.
 * Todo se guarda en este computador (localStorage). No hay servidor ni cuenta.
 */
(function () {
  'use strict';

  var C = window.RelojCore;
  var CLAVE_DATOS = 'reloj-eventos:datos:v1';
  var CLAVE_PREFS = 'reloj-eventos:prefs:v1';
  var CLAVE_AVISOS = 'reloj-eventos:avisos:v1';

  // En la app de escritorio los datos son archivos en una carpeta; en el navegador, localStorage.
  var ARCHIVOS = (window.relojEscritorio && window.relojEscritorio.almacen) || null;

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  // --- Estado ---------------------------------------------------------------

  var proyectos = [];
  var prefs = { filtro: 'todos', tema: 'oscuro', alertas: false, abiertos: [] };
  var avisosMostrados = {};
  var busqueda = '';
  var edicion = { id: null, color: C.COLORES[0] };
  var ultimoDestacado = null;

  function leerJSON(clave, porDefecto) {
    try {
      var bruto = localStorage.getItem(clave);
      return bruto ? JSON.parse(bruto) : porDefecto;
    } catch (e) {
      console.warn('No se pudo leer', clave, e);
      return porDefecto;
    }
  }

  function guardarJSON(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) {
      console.warn('No se pudo guardar', clave, e);
      avisar('No se pudo guardar', 'Revisa el espacio disponible del navegador.', 'vencido');
    }
  }

  function aplicarPrefs(p) {
    if (!p || typeof p !== 'object') return;
    prefs.filtro = p.filtro || 'todos';
    prefs.tema = p.tema === 'claro' ? 'claro' : 'oscuro';
    prefs.alertas = !!p.alertas;
    prefs.abiertos = Array.isArray(p.abiertos) ? p.abiertos : [];
  }

  function cargarTodo() {
    // Qué avisos ya se mostraron es información de este equipo: siempre local.
    avisosMostrados = leerJSON(CLAVE_AVISOS, {}) || {};

    if (!ARCHIVOS) {
      proyectos = C.normalizarDatos(leerJSON(CLAVE_DATOS, { proyectos: [] }));
      aplicarPrefs(leerJSON(CLAVE_PREFS, null));
      return Promise.resolve();
    }

    return Promise.all([ARCHIVOS.listar(), ARCHIVOS.leerPrefs()])
      .then(function (resultado) {
        proyectos = C.normalizarDatos(resultado[0]);
        aplicarPrefs(resultado[1] || leerJSON(CLAVE_PREFS, null));
        return trasladarDesdeNavegador();
      })
      .catch(function (e) {
        console.error(e);
        avisar('No se pudo leer la carpeta de datos', String((e && e.message) || e), 'vencido');
      });
  }

  /** La primera vez que se abre la app de escritorio, rescata lo guardado en el navegador. */
  function trasladarDesdeNavegador() {
    if (proyectos.length) return Promise.resolve();
    var previos = C.normalizarDatos(leerJSON(CLAVE_DATOS, { proyectos: [] }));
    if (!previos.length) return Promise.resolve();
    proyectos = previos;
    return ARCHIVOS.guardarTodos(proyectos).then(function () {
      avisar('Datos trasladados', previos.length + ' proyecto(s) ahora se guardan en la carpeta de datos.', 'ok');
    });
  }

  function guardarDatos() {
    if (ARCHIVOS) {
      return ARCHIVOS.guardarTodos(proyectos).catch(function (e) {
        console.error(e);
        avisar('No se pudo guardar en la carpeta', String((e && e.message) || e), 'vencido');
      });
    }
    guardarJSON(CLAVE_DATOS, { version: C.VERSION, actualizado: new Date().toISOString(), proyectos: proyectos });
    return Promise.resolve();
  }

  function guardarPrefs() {
    if (ARCHIVOS) return ARCHIVOS.guardarPrefs(prefs).catch(function (e) { console.error(e); });
    guardarJSON(CLAVE_PREFS, prefs);
    return Promise.resolve();
  }

  // --- Utilidades de interfaz ----------------------------------------------

  function escapar(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function avisar(titulo, detalle, tipo) {
    var caja = document.createElement('div');
    caja.className = 'toast' + (tipo ? ' ' + tipo : '');
    caja.innerHTML = '<strong>' + escapar(titulo) + '</strong>' +
      (detalle ? '<span>' + escapar(detalle) + '</span>' : '');
    $('#toasts').appendChild(caja);
    setTimeout(function () {
      caja.style.opacity = '0';
      caja.style.transform = 'translateY(8px)';
      setTimeout(function () { caja.remove(); }, 300);
    }, 6000);
  }

  /** Muestra dónde están guardados los datos y ofrece abrir la carpeta. */
  function pintarUbicacion() {
    var caja = $('#pieUbicacion');
    if (!ARCHIVOS) {
      caja.innerHTML = 'Los datos se guardan solo en este computador. Usa <em>Exportar respaldo</em> para llevártelos.';
      return;
    }
    ARCHIVOS.ruta().then(function (r) {
      caja.textContent = 'Tus proyectos se guardan como archivos en ';
      var ruta = document.createElement('code');
      ruta.textContent = r.carpeta;
      caja.appendChild(ruta);
      var boton = document.createElement('button');
      boton.id = 'btnCarpeta';
      boton.className = 'btn sutil';
      boton.textContent = 'Abrir carpeta';
      boton.addEventListener('click', function () {
        ARCHIVOS.abrirCarpeta().catch(function (e) { avisar('No se pudo abrir la carpeta', String(e.message || e), 'vencido'); });
      });
      caja.appendChild(boton);
    });
  }

  function aplicarTema() {
    document.documentElement.setAttribute('data-tema', prefs.tema === 'claro' ? 'claro' : 'oscuro');
    $('#btnTema').textContent = prefs.tema === 'claro' ? '☾' : '◐';
  }

  // --- Filtros --------------------------------------------------------------

  function coincideBusqueda(proyecto) {
    if (!busqueda) return true;
    var aguja = busqueda.toLowerCase();
    if ((proyecto.nombre + ' ' + proyecto.descripcion).toLowerCase().indexOf(aguja) >= 0) return true;
    return proyecto.hitos.some(function (h) {
      return (h.nombre + ' ' + h.descripcion).toLowerCase().indexOf(aguja) >= 0;
    });
  }

  function coincideFiltro(proyecto, ahora) {
    var r = C.resumenProyecto(proyecto, ahora);
    switch (prefs.filtro) {
      case 'activos': return r.pendientes > 0;
      case 'urgentes': return r.estado === 'critico' || r.estado === 'vencido';
      case 'vencidos': return r.vencidos > 0;
      case 'completados': return r.total > 0 && r.completados === r.total;
      default: return true;
    }
  }

  function visibles(ahora) {
    return C.ordenarProyectos(proyectos.filter(function (p) {
      return coincideBusqueda(p) && coincideFiltro(p, ahora);
    }), ahora);
  }

  // --- Dibujado -------------------------------------------------------------

  function plantillaPaso(hito, ahora) {
    var estado = C.estadoHito(hito, ahora);
    var tieneFecha = !!C.aDate(hito.fecha);
    return '' +
      '<li class="paso" data-estado="' + estado + '" data-hito="' + escapar(hito.id) + '">' +
        '<button class="punto" data-accion="alternar" title="' +
          (hito.completado ? 'Marcar como pendiente' : 'Marcar como cumplido') + '">✓</button>' +
        '<div class="paso-datos">' +
          '<h4>' + escapar(hito.nombre) +
            ' <span class="insignia" data-estado="' + estado + '">' + C.ETIQUETAS_ESTADO[estado] + '</span>' +
          '</h4>' +
          '<div class="fecha">' + escapar(C.formatearFecha(hito.fecha)) + '</div>' +
          (hito.descripcion ? '<p class="nota">' + escapar(hito.descripcion) + '</p>' : '') +
        '</div>' +
        (tieneFecha
          ? '<div class="paso-reloj" data-fecha="' + escapar(hito.fecha) + '" data-completado="' + (hito.completado ? '1' : '') + '">' +
              '<span class="cuenta" data-estado="' + estado + '"></span>' +
              '<span class="horas"></span>' +
            '</div>'
          : '') +
      '</li>';
  }

  function plantillaProyecto(proyecto, ahora) {
    var r = C.resumenProyecto(proyecto, ahora);
    var abierto = prefs.abiertos.indexOf(proyecto.id) >= 0;
    var hitos = C.ordenarHitos(proyecto.hitos);
    var completo = r.total > 0 && r.completados === r.total;

    var lineaEstado = completo
      ? 'Todos los pasos cumplidos 🎉'
      : (r.proximo
        ? r.completados + ' de ' + r.total + ' pasos cumplidos'
        : (r.total ? r.total + ' pasos, ninguno con fecha pendiente' : 'Sin pasos todavía'));

    var siguiente = r.proximo
      ? '<div class="paso-actual">Siguiente: <strong>' + escapar(r.proximo.nombre) + '</strong> · ' +
          escapar(C.formatearFecha(r.proximo.fecha)) + '</div>'
      : '';

    var reloj = r.proximo
      ? '<div class="proyecto-reloj" data-fecha="' + escapar(r.proximo.fecha) + '" data-completado="">' +
          '<span class="cuenta" data-estado="' + r.estado + '"></span>' +
          '<span class="horas"></span>' +
        '</div>'
      : '<div class="proyecto-reloj"><span class="cuenta" data-estado="completado">—</span>' +
        '<span class="horas">sin pasos pendientes</span></div>';

    var avance = '<div class="avance"' +
      (r.proximo ? ' data-progreso data-desde="' + escapar((r.anterior && r.anterior.fecha) || proyecto.creado || '') +
        '" data-hasta="' + escapar(r.proximo.fecha) + '"' : '') + '>' +
        '<div class="barra-tramo"><span style="width:' + Math.round(r.progreso * 100) + '%"></span></div>' +
        '<small>' + r.completados + '/' + r.total + '</small>' +
      '</div>';

    return '' +
      '<article class="proyecto' + (completo ? ' completo' : '') + (abierto ? ' abierto' : '') + '"' +
        ' data-id="' + escapar(proyecto.id) + '" style="--color-proyecto:' + escapar(proyecto.color) + '">' +
        '<div class="proyecto-cabecera" role="button" tabindex="0" aria-expanded="' + abierto + '">' +
          '<span class="flecha" aria-hidden="true">▶</span>' +
          '<div class="proyecto-titulo">' +
            '<h3>' + escapar(proyecto.nombre) +
              '<span class="insignia" data-estado="' + r.estado + '">' + C.ETIQUETAS_ESTADO[r.estado] + '</span>' +
            '</h3>' +
            '<p>' + escapar(lineaEstado) + '</p>' +
            siguiente +
          '</div>' +
          avance +
          reloj +
        '</div>' +
        '<div class="proyecto-cuerpo"' + (abierto ? '' : ' hidden') + '>' +
          (proyecto.descripcion ? '<p class="proyecto-descripcion">' + escapar(proyecto.descripcion) + '</p>' : '') +
          '<ul class="pasos">' + hitos.map(function (h) { return plantillaPaso(h, ahora); }).join('') + '</ul>' +
          '<div class="proyecto-pie">' +
            '<button class="btn sutil" data-accion="duplicar">Duplicar</button>' +
            '<button class="btn sutil peligro" data-accion="eliminar">Eliminar</button>' +
            '<button class="btn" data-accion="editar">Editar pasos y fechas</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render() {
    var ahora = Date.now();
    var lista = visibles(ahora);
    var contenedor = $('#lista');
    contenedor.innerHTML = lista.map(function (p) { return plantillaProyecto(p, ahora); }).join('');

    var hayProyectos = proyectos.length > 0;
    $('#vacio').hidden = hayProyectos;
    $('#resumen').hidden = !hayProyectos;
    $('#destacado').hidden = !C.proximoGlobal(proyectos, ahora);

    if (hayProyectos && !lista.length) {
      contenedor.innerHTML = '<p class="vacio">Ningún proyecto coincide con la búsqueda o el filtro.</p>';
    }
    ultimoDestacado = null;
    tick();
  }

  /** Cada segundo: solo se actualizan los números, no se rehace el HTML. */
  function tick() {
    var ahora = Date.now();
    var d = new Date(ahora);
    $('#horaActual').textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(function (n) { return String(n).padStart(2, '0'); }).join(':');
    $('#fechaActual').textContent = C.formatearFecha(d).replace(/,?\s*\d{1,2}:\d{2}.*$/, '');

    $$('[data-fecha]').forEach(function (caja) {
      var hito = { fecha: caja.dataset.fecha, completado: !!caja.dataset.completado };
      var estado = C.estadoHito(hito, ahora);
      var restante = C.enMs(C.aDate(hito.fecha)) - ahora;
      var cuenta = $('.cuenta', caja);
      var horas = $('.horas', caja);
      if (cuenta) {
        cuenta.textContent = hito.completado ? 'cumplido' : C.formatearCuenta(restante);
        cuenta.dataset.estado = estado;
      }
      if (horas) {
        horas.textContent = hito.completado
          ? C.formatearFecha(hito.fecha)
          : (restante < 0 ? 'hace ' + C.formatearHorasOMinutos(restante) : 'faltan ' + C.formatearHorasOMinutos(restante));
      }
      var fila = caja.closest('.paso') || caja.closest('.proyecto-cabecera');
      if (fila) {
        if (fila.classList.contains('paso')) fila.dataset.estado = estado;
        var insignia = $('.insignia', fila);
        if (insignia) {
          insignia.dataset.estado = estado;
          insignia.textContent = C.ETIQUETAS_ESTADO[estado];
        }
      }
    });

    $$('[data-progreso]').forEach(function (caja) {
      var pct = C.progresoTramo(caja.dataset.desde, caja.dataset.hasta, ahora) * 100;
      var barra = $('.barra-tramo span', caja);
      if (barra) barra.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
    });

    pintarDestacado(ahora);
    pintarResumen(ahora);
    revisarAlertas(ahora);
  }

  function pintarDestacado(ahora) {
    var mejor = C.proximoGlobal(proyectos, ahora);
    var caja = $('#destacado');
    if (!mejor) { caja.hidden = true; return; }
    caja.hidden = false;

    var estado = C.estadoHito(mejor.hito, ahora);
    caja.dataset.estado = estado;
    caja.style.setProperty('--color-proyecto', mejor.proyecto.color);

    if (ultimoDestacado !== mejor.hito.id) {
      ultimoDestacado = mejor.hito.id;
      $('#destacadoHito').textContent = mejor.hito.nombre;
      $('#destacadoProyecto').textContent = mejor.proyecto.nombre;
      $('#destacadoFecha').textContent = C.formatearFecha(mejor.hito.fecha);
    }
    $('#destacadoCuenta').textContent = C.formatearCuenta(mejor.restanteMs);
    $('#destacadoHoras').textContent = (mejor.restanteMs < 0 ? 'hace ' : 'faltan ') + C.formatearHorasOMinutos(mejor.restanteMs);
    $('#destacadoFrase').textContent = C.frasePlazo(mejor.restanteMs);
    var pct = C.progresoTramo(mejor.anterior && mejor.anterior.fecha, mejor.hito.fecha, ahora) * 100;
    $('#destacadoBarra').style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
  }

  function pintarResumen(ahora) {
    var s = C.estadisticas(proyectos, ahora);
    $('#statProyectos').textContent = s.proyectos;
    $('#statPendientes').textContent = s.pendientes;
    $('#statCriticos').textContent = s.criticos;
    $('#statVencidos').textContent = s.vencidos;
  }

  // --- Avisos ---------------------------------------------------------------

  var ultimaRevision = 0;
  function revisarAlertas(ahora) {
    if (!prefs.alertas) return;
    if (ahora - ultimaRevision < 5000) return;
    ultimaRevision = ahora;

    C.alertasPendientes(proyectos, ahora).forEach(function (aviso) {
      if (avisosMostrados[aviso.clave]) return;
      avisosMostrados[aviso.clave] = ahora;
      var titulo = aviso.proyecto.nombre;
      var texto = aviso.hito.nombre + ' — ' + C.frasePlazo(aviso.restanteMs);
      avisar(titulo, texto, aviso.restanteMs < 0 ? 'vencido' : 'critico');
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('⏳ ' + titulo, { body: texto, tag: aviso.clave });
        }
      } catch (e) { /* algunos navegadores lo bloquean en file:// */ }
    });
    guardarJSON(CLAVE_AVISOS, avisosMostrados);
  }

  function alternarAlertas() {
    if (prefs.alertas) {
      prefs.alertas = false;
      guardarPrefs();
      pintarBotonAlertas();
      avisar('Avisos desactivados', 'Ya no verás notificaciones automáticas.');
      return;
    }
    var activar = function () {
      prefs.alertas = true;
      guardarPrefs();
      pintarBotonAlertas();
      avisar('Avisos activados', 'Te avisaré 24 h antes, 1 h antes y al vencer cada paso.', 'ok');
    };
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(activar).catch(activar);
    } else {
      activar();
    }
  }

  function pintarBotonAlertas() {
    var b = $('#btnAlertas');
    b.classList.toggle('activo', prefs.alertas);
    b.title = prefs.alertas ? 'Avisos activados (clic para desactivar)' : 'Activar avisos de escritorio';
    b.setAttribute('aria-pressed', String(prefs.alertas));
  }

  // --- Editor de proyecto ---------------------------------------------------

  function filaPaso(hito) {
    var fila = document.createElement('div');
    fila.className = 'paso-editor';
    fila.dataset.id = (hito && hito.id) || '';
    fila.dataset.completado = hito && hito.completado ? '1' : '';
    fila.innerHTML = '' +
      '<input type="text" class="p-nombre" maxlength="140" placeholder="Nombre del paso (ej: Cierre de ofertas)">' +
      '<input type="datetime-local" class="p-fecha">' +
      '<button type="button" class="quitar" title="Quitar este paso">✕</button>' +
      '<textarea class="p-desc" rows="1" maxlength="400" placeholder="Descripción del paso (opcional)"></textarea>';
    $('.p-nombre', fila).value = (hito && hito.nombre) || '';
    $('.p-fecha', fila).value = hito ? C.aValorInput(hito.fecha) : '';
    $('.p-desc', fila).value = (hito && hito.descripcion) || '';
    $('.quitar', fila).addEventListener('click', function () {
      fila.remove();
      if (!$$('.paso-editor', $('#listaPasos')).length) agregarFilaPaso();
    });
    return fila;
  }

  function agregarFilaPaso(hito) {
    var fila = filaPaso(hito);
    $('#listaPasos').appendChild(fila);
    if (!hito) $('.p-nombre', fila).focus();
    return fila;
  }

  function pintarColores() {
    var caja = $('#campoColores');
    caja.innerHTML = C.COLORES.map(function (color) {
      return '<button type="button" style="background:' + color + '" data-color="' + color + '"' +
        ' aria-pressed="' + (color === edicion.color) + '" aria-label="Color ' + color + '"></button>';
    }).join('');
  }

  function abrirEditor(proyecto) {
    edicion.id = proyecto ? proyecto.id : null;
    edicion.color = proyecto ? proyecto.color : C.COLORES[Math.floor(Math.random() * C.COLORES.length)];
    $('#modalTitulo').textContent = proyecto ? 'Editar proyecto' : 'Nuevo proyecto';
    $('#campoNombre').value = proyecto ? proyecto.nombre : '';
    $('#campoDescripcion').value = proyecto ? proyecto.descripcion : '';
    $('#errorForm').hidden = true;
    pintarColores();

    $('#listaPasos').innerHTML = '';
    if (proyecto && proyecto.hitos.length) {
      C.ordenarHitos(proyecto.hitos).forEach(function (h) { agregarFilaPaso(h); });
    } else {
      agregarFilaPaso();
    }
    $('#modalProyecto').showModal();
    setTimeout(function () { $('#campoNombre').focus(); }, 30);
  }

  function leerEditor() {
    var nombre = $('#campoNombre').value.trim();
    if (!nombre) return { error: 'Ponle un nombre al proyecto.' };

    var hitos = [];
    var incompleto = false;
    $$('.paso-editor', $('#listaPasos')).forEach(function (fila) {
      var nom = $('.p-nombre', fila).value.trim();
      var fecha = $('.p-fecha', fila).value;
      var desc = $('.p-desc', fila).value.trim();
      if (!nom && !fecha && !desc) return;
      if (!nom || !fecha) { incompleto = true; return; }
      hitos.push(C.normalizarHito({
        id: fila.dataset.id || undefined,
        nombre: nom,
        descripcion: desc,
        fecha: C.desdeValorInput(fecha),
        completado: !!fila.dataset.completado
      }));
    });

    if (incompleto) return { error: 'Cada paso necesita nombre y fecha. Completa los que falten o quítalos.' };
    if (!hitos.length) return { error: 'Agrega al menos un paso con su fecha y hora.' };

    return {
      proyecto: C.normalizarProyecto({
        id: edicion.id || undefined,
        nombre: nombre,
        descripcion: $('#campoDescripcion').value.trim(),
        color: edicion.color,
        creado: edicion.id ? (buscarProyecto(edicion.id) || {}).creado : undefined,
        hitos: hitos
      })
    };
  }

  function buscarProyecto(id) {
    for (var i = 0; i < proyectos.length; i++) if (proyectos[i].id === id) return proyectos[i];
    return null;
  }

  function guardarProyecto(proyecto) {
    var indice = proyectos.findIndex(function (p) { return p.id === proyecto.id; });
    if (indice >= 0) proyectos[indice] = proyecto;
    else proyectos.push(proyecto);
    guardarDatos();
    render();
  }

  // --- Plantillas -----------------------------------------------------------

  function abrirPlantillas() {
    $('#campoFechaBase').value = C.aValorInput(new Date());
    $('#listaPlantillas').innerHTML = C.PLANTILLAS.map(function (pl) {
      return '<button type="button" class="plantilla" data-plantilla="' + pl.id + '"' +
        ' style="--color-plantilla:' + pl.color + '">' +
        '<strong>' + escapar(pl.nombre) + '</strong>' +
        '<span>' + escapar(pl.descripcion) + '</span>' +
        '<ol>' + pl.hitos.map(function (h) { return '<li>' + escapar(h.nombre) + '</li>'; }).join('') + '</ol>' +
      '</button>';
    }).join('');
    $('#modalPlantilla').showModal();
  }

  function usarPlantilla(id) {
    var pl = C.PLANTILLAS.filter(function (p) { return p.id === id; })[0];
    if (!pl) return;
    var base = C.aDate(C.desdeValorInput($('#campoFechaBase').value)) || new Date();
    $('#modalPlantilla').close();
    abrirEditor(C.aplicarPlantilla(pl, base));
    edicion.id = null; // la plantilla crea un proyecto nuevo
  }

  // --- Respaldo -------------------------------------------------------------

  function exportar() {
    if (!proyectos.length) { avisar('No hay nada que exportar'); return; }
    var datos = { app: 'Reloj de Eventos', version: C.VERSION, exportado: new Date().toISOString(), proyectos: proyectos };
    var blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'reloj-eventos-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    avisar('Respaldo generado', a.download, 'ok');
  }

  function importar(archivo) {
    var lector = new FileReader();
    lector.onload = function () {
      try {
        var entrantes = C.normalizarDatos(JSON.parse(String(lector.result)));
        if (!entrantes.length) { avisar('El archivo no tiene proyectos'); return; }
        var nuevos = 0, actualizados = 0;
        entrantes.forEach(function (p) {
          var i = proyectos.findIndex(function (x) { return x.id === p.id; });
          if (i >= 0) { proyectos[i] = p; actualizados++; } else { proyectos.push(p); nuevos++; }
        });
        guardarDatos();
        render();
        avisar('Respaldo importado', nuevos + ' nuevos, ' + actualizados + ' actualizados', 'ok');
      } catch (e) {
        avisar('No se pudo leer el archivo', 'Debe ser un respaldo .json de esta app.', 'vencido');
      }
    };
    lector.readAsText(archivo);
  }

  function cargarEjemplo() {
    var ahora = new Date();
    var hace2dias = new Date(ahora.getTime() - 2 * C.MS_DIA);
    var licitacion = C.aplicarPlantilla(C.PLANTILLAS[0], hace2dias);
    licitacion.nombre = 'Licitación 1234-56-LE26 — Servicio de soporte';
    licitacion.descripcion = 'Ejemplo: licitación publicada hace 2 días en Mercado Público.';
    licitacion.hitos[0].completado = true;

    var cumple = C.normalizarProyecto({
      nombre: 'Cumpleaños de mamá',
      descripcion: 'Ejemplo de evento simple.',
      color: '#f472b6',
      hitos: [
        { nombre: 'Comprar el regalo', fecha: new Date(ahora.getTime() + 5 * C.MS_DIA).toISOString(), descripcion: '' },
        { nombre: '¡Cumpleaños!', fecha: new Date(ahora.getTime() + 12 * C.MS_DIA).toISOString(), descripcion: 'Almuerzo familiar a las 13:00.' }
      ]
    });

    proyectos = proyectos.concat([licitacion, cumple]);
    prefs.abiertos = [licitacion.id];
    guardarDatos();
    guardarPrefs();
    render();
    avisar('Ejemplo cargado', 'Puedes editarlo o borrarlo cuando quieras.', 'ok');
  }

  function borrarTodo() {
    if (!confirm('¿Borrar todos los proyectos de este computador? Esta acción no se puede deshacer.')) return;
    proyectos = [];
    avisosMostrados = {};
    prefs.abiertos = [];
    guardarDatos();
    guardarPrefs();
    guardarJSON(CLAVE_AVISOS, avisosMostrados);
    render();
    avisar('Todo borrado');
  }

  // --- Eventos --------------------------------------------------------------

  function alternarProyecto(tarjeta) {
    var id = tarjeta.dataset.id;
    var cuerpo = $('.proyecto-cuerpo', tarjeta);
    var abierto = !cuerpo.hidden;
    cuerpo.hidden = abierto;
    tarjeta.classList.toggle('abierto', !abierto);
    $('.proyecto-cabecera', tarjeta).setAttribute('aria-expanded', String(!abierto));
    prefs.abiertos = prefs.abiertos.filter(function (x) { return x !== id; });
    if (!abierto) prefs.abiertos.push(id);
    guardarPrefs();
  }

  function conectar() {
    $('#btnNuevo').addEventListener('click', function () { abrirEditor(null); });
    $('#btnPlantilla').addEventListener('click', abrirPlantillas);
    $('#btnAlertas').addEventListener('click', alternarAlertas);
    $('#btnTema').addEventListener('click', function () {
      prefs.tema = prefs.tema === 'claro' ? 'oscuro' : 'claro';
      guardarPrefs();
      aplicarTema();
    });

    var menu = $('#menuMas');
    $('#btnMas').addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      $('#btnMas').setAttribute('aria-expanded', String(!menu.hidden));
    });
    document.addEventListener('click', function () { menu.hidden = true; });
    menu.addEventListener('click', function (e) {
      var boton = e.target.closest('[data-accion]');
      if (!boton) return;
      menu.hidden = true;
      ejecutarAccion(boton.dataset.accion);
    });

    $('#vacio').addEventListener('click', function (e) {
      var boton = e.target.closest('[data-accion]');
      if (boton) ejecutarAccion(boton.dataset.accion);
    });

    $('#busqueda').addEventListener('input', function (e) {
      busqueda = e.target.value.trim();
      render();
    });

    $('#filtros').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      prefs.filtro = chip.dataset.filtro;
      guardarPrefs();
      $$('.chip', $('#filtros')).forEach(function (c) { c.classList.toggle('activo', c === chip); });
      render();
    });

    $('#lista').addEventListener('click', function (e) {
      var tarjeta = e.target.closest('.proyecto');
      if (!tarjeta) return;
      var proyecto = buscarProyecto(tarjeta.dataset.id);
      if (!proyecto) return;

      var punto = e.target.closest('[data-accion="alternar"]');
      if (punto) {
        var idHito = punto.closest('.paso').dataset.hito;
        proyecto.hitos.forEach(function (h) { if (h.id === idHito) h.completado = !h.completado; });
        guardarDatos();
        render();
        return;
      }

      var accion = e.target.closest('[data-accion]');
      if (accion) {
        if (accion.dataset.accion === 'editar') abrirEditor(proyecto);
        if (accion.dataset.accion === 'duplicar') {
          var copia = C.normalizarProyecto({
            nombre: proyecto.nombre + ' (copia)',
            descripcion: proyecto.descripcion,
            color: proyecto.color,
            hitos: proyecto.hitos.map(function (h) {
              return { nombre: h.nombre, descripcion: h.descripcion, fecha: h.fecha, completado: false };
            })
          });
          proyectos.push(copia);
          guardarDatos();
          render();
          avisar('Proyecto duplicado', copia.nombre, 'ok');
        }
        if (accion.dataset.accion === 'eliminar') {
          if (confirm('¿Eliminar "' + proyecto.nombre + '" y todos sus pasos?')) {
            proyectos = proyectos.filter(function (p) { return p.id !== proyecto.id; });
            guardarDatos();
            render();
            avisar('Proyecto eliminado', proyecto.nombre);
          }
        }
        return;
      }

      if (e.target.closest('.proyecto-cabecera')) alternarProyecto(tarjeta);
    });

    $('#lista').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var cabecera = e.target.closest('.proyecto-cabecera');
      if (!cabecera) return;
      e.preventDefault();
      alternarProyecto(cabecera.closest('.proyecto'));
    });

    $('#btnAgregarPaso').addEventListener('click', function () { agregarFilaPaso(); });

    $('#campoColores').addEventListener('click', function (e) {
      var boton = e.target.closest('[data-color]');
      if (!boton) return;
      edicion.color = boton.dataset.color;
      pintarColores();
    });

    $('#formProyecto').addEventListener('submit', function (e) {
      var resultado = leerEditor();
      if (resultado.error) {
        e.preventDefault();
        var caja = $('#errorForm');
        caja.textContent = resultado.error;
        caja.hidden = false;
        return;
      }
      guardarProyecto(resultado.proyecto);
      avisar('Proyecto guardado', resultado.proyecto.nombre + ' · ' + resultado.proyecto.hitos.length + ' pasos', 'ok');
    });

    $('#listaPlantillas').addEventListener('click', function (e) {
      var boton = e.target.closest('[data-plantilla]');
      if (boton) usarPlantilla(boton.dataset.plantilla);
    });

    $$('[data-cerrar]').forEach(function (boton) {
      boton.addEventListener('click', function () { boton.closest('dialog').close(); });
    });

    $('#archivoImportar').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importar(e.target.files[0]);
      e.target.value = '';
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        abrirEditor(null);
      }
    });
  }

  function ejecutarAccion(accion) {
    if (accion === 'nuevo') abrirEditor(null);
    if (accion === 'plantillas') abrirPlantillas();
    if (accion === 'exportar') exportar();
    if (accion === 'importar') $('#archivoImportar').click();
    if (accion === 'ejemplo') cargarEjemplo();
    if (accion === 'borrar') borrarTodo();
  }

  // --- Arranque -------------------------------------------------------------

  function iniciar() {
    conectar();
    $('#pieVersion').textContent = 'Reloj de Eventos v' + C.VERSION +
      (window.relojEscritorio ? ' · app de escritorio' : '');
    cargarTodo().then(function () {
      aplicarTema();
      pintarBotonAlertas();
      pintarUbicacion();
      $$('.chip', $('#filtros')).forEach(function (c) {
        c.classList.toggle('activo', c.dataset.filtro === prefs.filtro);
      });
      render();
      setInterval(tick, 1000);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
