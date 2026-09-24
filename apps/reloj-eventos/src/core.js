/*
 * Reloj de Eventos — núcleo de lógica (sin interfaz).
 * Se carga como <script> clásico en el navegador y con require() en las pruebas.
 */
(function (global) {
  'use strict';

  var MS_SEGUNDO = 1000;
  var MS_MINUTO = 60 * MS_SEGUNDO;
  var MS_HORA = 60 * MS_MINUTO;
  var MS_DIA = 24 * MS_HORA;

  // Un paso pasa a "crítico" dentro de las últimas 24 h y a "atención" dentro de 7 días.
  var UMBRAL_CRITICO = 24 * MS_HORA;
  var UMBRAL_ATENCION = 7 * MS_DIA;

  var COLORES = ['#38bdf8', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#facc15', '#f87171', '#60a5fa'];

  function crearId(prefijo) {
    return (prefijo || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Convierte lo que sea (Date, número, texto ISO) en Date, o null si no es válido. */
  function aDate(valor) {
    if (valor instanceof Date) return isNaN(valor.getTime()) ? null : new Date(valor.getTime());
    if (typeof valor === 'number') return isNaN(valor) ? null : new Date(valor);
    if (typeof valor === 'string' && valor.trim()) {
      var d = new Date(valor);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  function enMs(momento) {
    if (momento == null) return Date.now();
    if (momento instanceof Date) return momento.getTime();
    if (typeof momento === 'number') return momento;
    var d = aDate(momento);
    return d ? d.getTime() : Date.now();
  }

  /** Texto para <input type="datetime-local">, en hora local. */
  function aValorInput(valor) {
    var d = aDate(valor);
    if (!d) return '';
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /** Texto de <input type="datetime-local"> (hora local) a ISO absoluto. */
  function desdeValorInput(texto) {
    var d = aDate(texto);
    return d ? d.toISOString() : null;
  }

  function desglose(ms) {
    var vencido = ms < 0;
    var abs = Math.abs(ms);
    return {
      ms: ms,
      vencido: vencido,
      dias: Math.floor(abs / MS_DIA),
      horas: Math.floor((abs % MS_DIA) / MS_HORA),
      minutos: Math.floor((abs % MS_HORA) / MS_MINUTO),
      segundos: Math.floor((abs % MS_MINUTO) / MS_SEGUNDO),
      totalHoras: abs / MS_HORA,
      totalDias: abs / MS_DIA
    };
  }

  function dosDigitos(n) { return String(n).padStart(2, '0'); }

  /** "3d 04:12:55" o "04:12:55" cuando falta menos de un día. */
  function formatearCuenta(ms) {
    var d = desglose(ms);
    var reloj = dosDigitos(d.horas) + ':' + dosDigitos(d.minutos) + ':' + dosDigitos(d.segundos);
    return d.dias > 0 ? d.dias + 'd ' + reloj : reloj;
  }

  /** Horas totales que faltan, que es la unidad que pide el reloj: "76,3 h". */
  function formatearHoras(ms) {
    var total = desglose(ms).totalHoras;
    var texto = total >= 100
      ? String(Math.round(total)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      : total.toFixed(1).replace('.', ',');
    return texto + ' h';
  }

  /** Como formatearHoras, pero baja a minutos o segundos cuando queda menos de una hora. */
  function formatearHorasOMinutos(ms) {
    var d = desglose(ms);
    if (d.totalHoras >= 1) return formatearHoras(ms);
    var minutos = Math.floor(Math.abs(ms) / MS_MINUTO);
    if (minutos >= 1) return minutos + ' min';
    return Math.floor(Math.abs(ms) / MS_SEGUNDO) + ' s';
  }

  /** "faltan 3 días y 4 horas" / "venció hace 2 horas". */
  function frasePlazo(ms) {
    var d = desglose(ms);
    var texto;
    var plural = function (n, singular, prular) { return n + ' ' + (n === 1 ? singular : prular); };
    if (d.dias > 0) {
      texto = plural(d.dias, 'día', 'días') + (d.horas ? ' y ' + plural(d.horas, 'hora', 'horas') : '');
    } else if (d.horas > 0) {
      texto = plural(d.horas, 'hora', 'horas') + (d.minutos ? ' y ' + plural(d.minutos, 'minuto', 'minutos') : '');
    } else if (d.minutos > 0) {
      texto = plural(d.minutos, 'minuto', 'minutos') + (d.segundos ? ' y ' + plural(d.segundos, 'segundo', 'segundos') : '');
    } else {
      texto = plural(d.segundos, 'segundo', 'segundos');
    }
    if (d.vencido) return 'venció hace ' + texto;
    return (/^1 (día|hora|minuto|segundo)$/.test(texto) ? 'falta ' : 'faltan ') + texto;
  }

  var FORMATO_LARGO = null;
  /** "lun 5 oct 2026, 15:30" */
  function formatearFecha(valor) {
    var d = aDate(valor);
    if (!d) return 'Sin fecha';
    try {
      if (!FORMATO_LARGO) {
        FORMATO_LARGO = new Intl.DateTimeFormat('es-CL', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        });
      }
      return FORMATO_LARGO.format(d);
    } catch (e) {
      return d.toLocaleString();
    }
  }

  function estadoHito(hito, ahora) {
    if (!hito) return 'sin-fecha';
    if (hito.completado) return 'completado';
    var fecha = aDate(hito.fecha);
    if (!fecha) return 'sin-fecha';
    var restante = fecha.getTime() - enMs(ahora);
    if (restante < 0) return 'vencido';
    if (restante <= UMBRAL_CRITICO) return 'critico';
    if (restante <= UMBRAL_ATENCION) return 'atencion';
    return 'futuro';
  }

  var ETIQUETAS_ESTADO = {
    completado: 'Listo',
    vencido: 'Vencido',
    critico: 'Últimas horas',
    atencion: 'Esta semana',
    futuro: 'Programado',
    'sin-fecha': 'Sin fecha'
  };

  /** Copia ordenada cronológicamente; los pasos sin fecha quedan al final. */
  function ordenarHitos(hitos) {
    return (hitos || []).slice().sort(function (a, b) {
      var fa = aDate(a && a.fecha);
      var fb = aDate(b && b.fecha);
      if (!fa && !fb) return 0;
      if (!fa) return 1;
      if (!fb) return -1;
      return fa.getTime() - fb.getTime();
    });
  }

  /** El paso pendiente más cercano en el tiempo (aunque ya esté vencido). */
  function proximoHito(proyecto, ahora) {
    var pendientes = ordenarHitos((proyecto && proyecto.hitos) || []).filter(function (h) {
      return !h.completado && aDate(h.fecha);
    });
    return pendientes.length ? pendientes[0] : null;
  }

  /** El último paso ya cumplido o vencido antes de "ahora": sirve de inicio del tramo. */
  function hitoAnterior(proyecto, referencia, ahora) {
    var t = referencia ? enMs(aDate(referencia.fecha)) : enMs(ahora);
    var previos = ordenarHitos((proyecto && proyecto.hitos) || []).filter(function (h) {
      var f = aDate(h.fecha);
      return f && f.getTime() < t;
    });
    return previos.length ? previos[previos.length - 1] : null;
  }

  function resumenProyecto(proyecto, ahora) {
    var t = enMs(ahora);
    var hitos = (proyecto && proyecto.hitos) || [];
    var completados = 0, vencidos = 0, pendientes = 0;
    hitos.forEach(function (h) {
      if (h.completado) { completados++; return; }
      pendientes++;
      var f = aDate(h.fecha);
      if (f && f.getTime() < t) vencidos++;
    });
    var proximo = proximoHito(proyecto, t);
    var restanteMs = proximo ? enMs(aDate(proximo.fecha)) - t : null;
    var estado = hitos.length && completados === hitos.length
      ? 'completado'
      : (proximo ? estadoHito(proximo, t) : 'sin-fecha');
    return {
      total: hitos.length,
      completados: completados,
      pendientes: pendientes,
      vencidos: vencidos,
      proximo: proximo,
      anterior: proximo ? hitoAnterior(proyecto, proximo, t) : null,
      restanteMs: restanteMs,
      progreso: hitos.length ? completados / hitos.length : 0,
      estado: estado
    };
  }

  /** Avance (0..1) dentro del tramo entre el paso anterior y el siguiente. */
  function progresoTramo(desde, hasta, ahora) {
    var fin = enMs(aDate(hasta));
    var inicio = desde ? enMs(aDate(desde)) : null;
    var t = enMs(ahora);
    if (!fin) return 0;
    if (inicio == null || inicio >= fin) inicio = fin - 7 * MS_DIA;
    if (t <= inicio) return 0;
    if (t >= fin) return 1;
    return (t - inicio) / (fin - inicio);
  }

  /** Ordena proyectos por urgencia: primero lo que vence antes; lo terminado al final. */
  function ordenarProyectos(proyectos, ahora) {
    var t = enMs(ahora);
    return (proyectos || []).slice().sort(function (a, b) {
      var ra = resumenProyecto(a, t);
      var rb = resumenProyecto(b, t);
      var va = ra.restanteMs == null ? Infinity : ra.restanteMs;
      var vb = rb.restanteMs == null ? Infinity : rb.restanteMs;
      if (va !== vb) return va - vb;
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
    });
  }

  /** El vencimiento más próximo de toda la cartera, para el reloj principal. */
  function proximoGlobal(proyectos, ahora) {
    var t = enMs(ahora);
    var mejor = null;
    (proyectos || []).forEach(function (p) {
      var r = resumenProyecto(p, t);
      if (!r.proximo) return;
      if (!mejor || r.restanteMs < mejor.restanteMs) {
        mejor = { proyecto: p, hito: r.proximo, anterior: r.anterior, restanteMs: r.restanteMs };
      }
    });
    return mejor;
  }

  function estadisticas(proyectos, ahora) {
    var t = enMs(ahora);
    var total = 0, pendientes = 0, vencidos = 0, criticos = 0;
    (proyectos || []).forEach(function (p) {
      (p.hitos || []).forEach(function (h) {
        total++;
        if (h.completado) return;
        pendientes++;
        var estado = estadoHito(h, t);
        if (estado === 'vencido') vencidos++;
        else if (estado === 'critico') criticos++;
      });
    });
    return { proyectos: (proyectos || []).length, hitos: total, pendientes: pendientes, vencidos: vencidos, criticos: criticos };
  }

  /**
   * Avisos que corresponde mostrar ahora. Cada aviso trae una clave estable
   * (paso + umbral) para que la interfaz no repita la misma notificación.
   */
  function alertasPendientes(proyectos, ahora, umbrales) {
    var t = enMs(ahora);
    var escalones = (umbrales && umbrales.length ? umbrales.slice() : [24 * MS_HORA, MS_HORA, 0])
      .sort(function (a, b) { return b - a; });
    var avisos = [];
    (proyectos || []).forEach(function (p) {
      (p.hitos || []).forEach(function (h) {
        if (h.completado) return;
        var f = aDate(h.fecha);
        if (!f) return;
        var restante = f.getTime() - t;
        // No insistir con lo que venció hace más de un día.
        if (restante < -MS_DIA) return;
        var alcanzado = null;
        for (var i = 0; i < escalones.length; i++) {
          if (restante <= escalones[i]) alcanzado = escalones[i];
        }
        if (alcanzado == null) return;
        avisos.push({
          clave: h.id + ':' + alcanzado,
          proyecto: p,
          hito: h,
          restanteMs: restante,
          umbral: alcanzado
        });
      });
    });
    return avisos;
  }

  // --- Plantillas -----------------------------------------------------------

  var PLANTILLAS = [
    {
      id: 'licitacion',
      nombre: 'Licitación Mercado Público',
      descripcion: 'Los plazos típicos de una licitación: preguntas, respuestas, cierre de ofertas y adjudicación.',
      color: '#38bdf8',
      hitos: [
        { nombre: 'Publicación de las bases', descripcion: 'Revisar bases administrativas y técnicas, y anexos obligatorios.', offsetHoras: 0 },
        { nombre: 'Cierre de preguntas', descripcion: 'Último momento para enviar consultas por el foro del portal.', offsetHoras: 72 },
        { nombre: 'Publicación de respuestas', descripcion: 'Descargar el acta de respuestas y revisar si modifican las bases.', offsetHoras: 144 },
        { nombre: 'Cierre de ofertas (fecha límite para participar)', descripcion: 'Subir oferta técnica y económica. No hay prórroga después de esta hora.', offsetHoras: 240 },
        { nombre: 'Acto de apertura', descripcion: 'Apertura electrónica de las ofertas recibidas.', offsetHoras: 241 },
        { nombre: 'Fecha estimada de adjudicación', descripcion: 'Revisar resultado y plazo para reclamos.', offsetHoras: 720 }
      ]
    },
    {
      id: 'cumpleanos',
      nombre: 'Cumpleaños',
      descripcion: 'Cuenta regresiva simple para una fecha importante.',
      color: '#f472b6',
      hitos: [
        { nombre: 'Comprar el regalo', descripcion: '', offsetHoras: -168 },
        { nombre: '¡Cumpleaños!', descripcion: '', offsetHoras: 0 }
      ]
    },
    {
      id: 'tramite',
      nombre: 'Trámite o postulación',
      descripcion: 'Reunir documentos, enviar, esperar respuesta y plazo de apelación.',
      color: '#a78bfa',
      hitos: [
        { nombre: 'Reunir documentos', descripcion: '', offsetHoras: 0 },
        { nombre: 'Enviar la solicitud', descripcion: '', offsetHoras: 48 },
        { nombre: 'Plazo de respuesta de la institución', descripcion: '', offsetHoras: 480 },
        { nombre: 'Último día para apelar', descripcion: '', offsetHoras: 600 }
      ]
    },
    {
      id: 'entrega',
      nombre: 'Entrega de proyecto',
      descripcion: 'Hitos de avance y entrega final con su revisión.',
      color: '#34d399',
      hitos: [
        { nombre: 'Primer avance', descripcion: '', offsetHoras: 0 },
        { nombre: 'Revisión con el cliente', descripcion: '', offsetHoras: 168 },
        { nombre: 'Entrega final', descripcion: '', offsetHoras: 336 }
      ]
    }
  ];

  /** Crea un proyecto a partir de una plantilla, con los pasos desplazados desde una fecha base. */
  function aplicarPlantilla(plantilla, fechaBase) {
    var base = aDate(fechaBase) || new Date();
    return normalizarProyecto({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      color: plantilla.color,
      hitos: plantilla.hitos.map(function (h) {
        return {
          nombre: h.nombre,
          descripcion: h.descripcion,
          fecha: new Date(base.getTime() + h.offsetHoras * MS_HORA).toISOString()
        };
      })
    });
  }

  // --- Normalización y respaldo --------------------------------------------

  function normalizarHito(hito) {
    var fecha = aDate(hito && hito.fecha);
    return {
      id: (hito && hito.id) || crearId('hito'),
      nombre: String((hito && hito.nombre) || 'Paso sin nombre').trim(),
      descripcion: String((hito && hito.descripcion) || '').trim(),
      fecha: fecha ? fecha.toISOString() : null,
      completado: !!(hito && hito.completado)
    };
  }

  function normalizarProyecto(proyecto) {
    var p = proyecto || {};
    return {
      id: p.id || crearId('proy'),
      nombre: String(p.nombre || 'Proyecto sin nombre').trim(),
      descripcion: String(p.descripcion || '').trim(),
      color: COLORES.indexOf(p.color) >= 0 ? p.color : (p.color || COLORES[0]),
      creado: aDate(p.creado) ? aDate(p.creado).toISOString() : new Date().toISOString(),
      hitos: ordenarHitos((p.hitos || []).map(normalizarHito))
    };
  }

  /** Acepta el formato de respaldo {version, proyectos} o una lista suelta. */
  function normalizarDatos(datos) {
    var lista = Array.isArray(datos) ? datos : (datos && Array.isArray(datos.proyectos) ? datos.proyectos : []);
    return lista.map(normalizarProyecto);
  }

  var api = {
    VERSION: '1.0.0',
    MS_SEGUNDO: MS_SEGUNDO, MS_MINUTO: MS_MINUTO, MS_HORA: MS_HORA, MS_DIA: MS_DIA,
    UMBRAL_CRITICO: UMBRAL_CRITICO, UMBRAL_ATENCION: UMBRAL_ATENCION,
    COLORES: COLORES,
    ETIQUETAS_ESTADO: ETIQUETAS_ESTADO,
    PLANTILLAS: PLANTILLAS,
    crearId: crearId,
    aDate: aDate,
    enMs: enMs,
    aValorInput: aValorInput,
    desdeValorInput: desdeValorInput,
    desglose: desglose,
    formatearCuenta: formatearCuenta,
    formatearHoras: formatearHoras,
    formatearHorasOMinutos: formatearHorasOMinutos,
    formatearFecha: formatearFecha,
    frasePlazo: frasePlazo,
    estadoHito: estadoHito,
    ordenarHitos: ordenarHitos,
    proximoHito: proximoHito,
    hitoAnterior: hitoAnterior,
    resumenProyecto: resumenProyecto,
    progresoTramo: progresoTramo,
    ordenarProyectos: ordenarProyectos,
    proximoGlobal: proximoGlobal,
    estadisticas: estadisticas,
    alertasPendientes: alertasPendientes,
    aplicarPlantilla: aplicarPlantilla,
    normalizarHito: normalizarHito,
    normalizarProyecto: normalizarProyecto,
    normalizarDatos: normalizarDatos
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  global.RelojCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
