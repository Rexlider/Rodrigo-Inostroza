const test = require('node:test');
const assert = require('node:assert');
const C = require('../src/core.js');

const H = C.MS_HORA;
const D = C.MS_DIA;
const AHORA = new Date('2026-10-01T12:00:00Z').getTime();

function hito(extra) {
  return C.normalizarHito(Object.assign({ nombre: 'Paso', fecha: new Date(AHORA + 3 * D).toISOString() }, extra));
}

test('desglose separa días, horas, minutos y segundos', () => {
  const d = C.desglose(3 * D + 4 * H + 12 * 60000 + 5000);
  assert.deepStrictEqual([d.dias, d.horas, d.minutos, d.segundos], [3, 4, 12, 5]);
  assert.strictEqual(d.vencido, false);
  assert.strictEqual(C.desglose(-H).vencido, true);
});

test('formatearCuenta muestra días solo cuando corresponde', () => {
  assert.strictEqual(C.formatearCuenta(3 * D + 4 * H + 12 * 60000 + 5000), '3d 04:12:05');
  assert.strictEqual(C.formatearCuenta(4 * H + 5000), '04:00:05');
  assert.strictEqual(C.formatearCuenta(-2 * H), '02:00:00');
});

test('formatearHoras entrega las horas totales que faltan', () => {
  assert.strictEqual(C.formatearHoras(76.3 * H), '76,3 h');
  assert.strictEqual(C.formatearHoras(240 * H), '240 h');
  assert.strictEqual(C.formatearHoras(-3 * H), '3,0 h');
  assert.strictEqual(C.formatearHoras(1234 * H), '1.234 h');
});

test('formatearHorasOMinutos baja a minutos y segundos bajo la hora', () => {
  assert.strictEqual(C.formatearHorasOMinutos(5 * H), '5,0 h');
  assert.strictEqual(C.formatearHorasOMinutos(45 * 60000), '45 min');
  assert.strictEqual(C.formatearHorasOMinutos(-30 * 1000), '30 s');
  assert.strictEqual(C.formatearHorasOMinutos(-20 * 60000), '20 min');
});

test('frasePlazo usa singular, plural y pasado', () => {
  assert.strictEqual(C.frasePlazo(3 * D + 4 * H), 'faltan 3 días y 4 horas');
  assert.strictEqual(C.frasePlazo(D), 'falta 1 día');
  assert.strictEqual(C.frasePlazo(90 * 60000), 'faltan 1 hora y 30 minutos');
  assert.strictEqual(C.frasePlazo(-2 * H), 'venció hace 2 horas');
});

test('estadoHito clasifica según cuánto falta', () => {
  assert.strictEqual(C.estadoHito(hito({ fecha: new Date(AHORA + 30 * D).toISOString() }), AHORA), 'futuro');
  assert.strictEqual(C.estadoHito(hito({ fecha: new Date(AHORA + 3 * D).toISOString() }), AHORA), 'atencion');
  assert.strictEqual(C.estadoHito(hito({ fecha: new Date(AHORA + 5 * H).toISOString() }), AHORA), 'critico');
  assert.strictEqual(C.estadoHito(hito({ fecha: new Date(AHORA - H).toISOString() }), AHORA), 'vencido');
  assert.strictEqual(C.estadoHito(hito({ completado: true, fecha: new Date(AHORA - H).toISOString() }), AHORA), 'completado');
  assert.strictEqual(C.estadoHito(C.normalizarHito({ nombre: 'x' }), AHORA), 'sin-fecha');
});

test('ordenarHitos deja los pasos en orden cronológico y los sin fecha al final', () => {
  const orden = C.ordenarHitos([
    { id: 'c', nombre: 'c', fecha: null },
    { id: 'b', nombre: 'b', fecha: new Date(AHORA + 2 * D).toISOString() },
    { id: 'a', nombre: 'a', fecha: new Date(AHORA + D).toISOString() }
  ]).map((h) => h.id);
  assert.deepStrictEqual(orden, ['a', 'b', 'c']);
});

test('proximoHito ignora los pasos ya cumplidos', () => {
  const proyecto = C.normalizarProyecto({
    nombre: 'Licitación',
    hitos: [
      { id: 'h1', nombre: 'Publicación', fecha: new Date(AHORA - 2 * D).toISOString(), completado: true },
      { id: 'h2', nombre: 'Cierre de preguntas', fecha: new Date(AHORA + D).toISOString() },
      { id: 'h3', nombre: 'Cierre de ofertas', fecha: new Date(AHORA + 8 * D).toISOString() }
    ]
  });
  assert.strictEqual(C.proximoHito(proyecto, AHORA).id, 'h2');
});

test('proximoHito devuelve el pendiente vencido cuando no queda nada por delante', () => {
  const proyecto = C.normalizarProyecto({
    nombre: 'Trámite',
    hitos: [{ id: 'v', nombre: 'Plazo pasado', fecha: new Date(AHORA - 5 * H).toISOString() }]
  });
  const p = C.proximoHito(proyecto, AHORA);
  assert.strictEqual(p.id, 'v');
  assert.strictEqual(C.estadoHito(p, AHORA), 'vencido');
});

test('resumenProyecto cuenta cumplidos, pendientes y vencidos', () => {
  const proyecto = C.normalizarProyecto({
    nombre: 'Proyecto',
    hitos: [
      { nombre: 'a', fecha: new Date(AHORA - 3 * D).toISOString(), completado: true },
      { nombre: 'b', fecha: new Date(AHORA - D).toISOString() },
      { nombre: 'c', fecha: new Date(AHORA + 2 * D).toISOString() }
    ]
  });
  const r = C.resumenProyecto(proyecto, AHORA);
  assert.strictEqual(r.total, 3);
  assert.strictEqual(r.completados, 1);
  assert.strictEqual(r.pendientes, 2);
  assert.strictEqual(r.vencidos, 1);
  assert.strictEqual(r.proximo.nombre, 'b');
  assert.strictEqual(r.estado, 'vencido');
  assert.ok(Math.abs(r.progreso - 1 / 3) < 1e-9);
});

test('resumenProyecto marca completado cuando no queda nada', () => {
  const proyecto = C.normalizarProyecto({
    nombre: 'Listo',
    hitos: [{ nombre: 'a', fecha: new Date(AHORA - D).toISOString(), completado: true }]
  });
  assert.strictEqual(C.resumenProyecto(proyecto, AHORA).estado, 'completado');
});

test('progresoTramo mide el avance entre dos pasos', () => {
  const desde = new Date(AHORA - 5 * D).toISOString();
  const hasta = new Date(AHORA + 5 * D).toISOString();
  assert.ok(Math.abs(C.progresoTramo(desde, hasta, AHORA) - 0.5) < 1e-9);
  assert.strictEqual(C.progresoTramo(desde, hasta, AHORA - 6 * D), 0);
  assert.strictEqual(C.progresoTramo(desde, hasta, AHORA + 6 * D), 1);
});

test('proximoGlobal encuentra el vencimiento más cercano de todos los proyectos', () => {
  const p1 = C.normalizarProyecto({ nombre: 'Uno', hitos: [{ nombre: 'lejos', fecha: new Date(AHORA + 10 * D).toISOString() }] });
  const p2 = C.normalizarProyecto({ nombre: 'Dos', hitos: [{ nombre: 'cerca', fecha: new Date(AHORA + 2 * H).toISOString() }] });
  const mejor = C.proximoGlobal([p1, p2], AHORA);
  assert.strictEqual(mejor.hito.nombre, 'cerca');
  assert.strictEqual(mejor.proyecto.nombre, 'Dos');
  assert.strictEqual(mejor.restanteMs, 2 * H);
});

test('ordenarProyectos pone primero lo que vence antes', () => {
  const p1 = C.normalizarProyecto({ nombre: 'Lejos', hitos: [{ nombre: 'x', fecha: new Date(AHORA + 10 * D).toISOString() }] });
  const p2 = C.normalizarProyecto({ nombre: 'Cerca', hitos: [{ nombre: 'y', fecha: new Date(AHORA + D).toISOString() }] });
  const p3 = C.normalizarProyecto({ nombre: 'Terminado', hitos: [{ nombre: 'z', fecha: new Date(AHORA).toISOString(), completado: true }] });
  assert.deepStrictEqual(C.ordenarProyectos([p1, p2, p3], AHORA).map((p) => p.nombre), ['Cerca', 'Lejos', 'Terminado']);
});

test('estadisticas resume la cartera completa', () => {
  const p = C.normalizarProyecto({
    nombre: 'p',
    hitos: [
      { nombre: 'a', fecha: new Date(AHORA - D).toISOString() },
      { nombre: 'b', fecha: new Date(AHORA + 3 * H).toISOString() },
      { nombre: 'c', fecha: new Date(AHORA + 20 * D).toISOString() },
      { nombre: 'd', fecha: new Date(AHORA + D).toISOString(), completado: true }
    ]
  });
  const s = C.estadisticas([p], AHORA);
  assert.deepStrictEqual(
    { proyectos: s.proyectos, hitos: s.hitos, pendientes: s.pendientes, vencidos: s.vencidos, criticos: s.criticos },
    { proyectos: 1, hitos: 4, pendientes: 3, vencidos: 1, criticos: 1 }
  );
});

test('alertasPendientes avisa por escalón y con clave estable', () => {
  const p = C.normalizarProyecto({
    nombre: 'p',
    hitos: [
      { id: 'h1', nombre: 'en 20 h', fecha: new Date(AHORA + 20 * H).toISOString() },
      { id: 'h2', nombre: 'en 30 min', fecha: new Date(AHORA + 30 * 60000).toISOString() },
      { id: 'h3', nombre: 'en 10 días', fecha: new Date(AHORA + 10 * D).toISOString() },
      { id: 'h4', nombre: 'cumplido', fecha: new Date(AHORA + H).toISOString(), completado: true }
    ]
  });
  const claves = C.alertasPendientes([p], AHORA).map((a) => a.clave);
  // Vienen en orden cronológico: primero lo más urgente. El paso a 10 días y el cumplido no avisan.
  assert.deepStrictEqual(claves, ['h2:' + H, 'h1:' + 24 * H]);
  // La clave no cambia mientras no se cruce otro escalón, así no se repite el aviso.
  const despues = C.alertasPendientes([p], AHORA + 60000).map((a) => a.clave);
  assert.ok(despues.includes('h1:' + 24 * H) && despues.includes('h2:' + H));
});

test('alertasPendientes deja de insistir con lo vencido hace más de un día', () => {
  const p = C.normalizarProyecto({
    nombre: 'p',
    hitos: [
      { id: 'viejo', nombre: 'viejo', fecha: new Date(AHORA - 2 * D).toISOString() },
      { id: 'reciente', nombre: 'reciente', fecha: new Date(AHORA - 2 * H).toISOString() }
    ]
  });
  assert.deepStrictEqual(C.alertasPendientes([p], AHORA).map((a) => a.clave), ['reciente:0']);
});

test('aplicarPlantilla crea los pasos desplazados desde la fecha base', () => {
  const base = new Date(AHORA);
  const proyecto = C.aplicarPlantilla(C.PLANTILLAS[0], base);
  assert.strictEqual(proyecto.hitos.length, C.PLANTILLAS[0].hitos.length);
  assert.strictEqual(C.aDate(proyecto.hitos[0].fecha).getTime(), AHORA);
  const cierre = proyecto.hitos.find((h) => /Cierre de ofertas/.test(h.nombre));
  assert.strictEqual(C.aDate(cierre.fecha).getTime(), AHORA + 240 * H);
  assert.ok(proyecto.hitos.every((h) => h.id && !h.completado));
});

test('la plantilla de licitación cubre los plazos del proceso', () => {
  const nombres = C.PLANTILLAS[0].hitos.map((h) => h.nombre).join(' | ').toLowerCase();
  ['preguntas', 'respuestas', 'cierre de ofertas', 'apertura', 'adjudicación'].forEach((clave) => {
    assert.ok(nombres.includes(clave), 'falta el hito: ' + clave);
  });
});

test('normalizarDatos acepta el formato de respaldo y el de lista suelta', () => {
  const respaldo = { version: '1.0.0', proyectos: [{ nombre: 'A', hitos: [{ nombre: 'x', fecha: new Date(AHORA).toISOString() }] }] };
  assert.strictEqual(C.normalizarDatos(respaldo).length, 1);
  assert.strictEqual(C.normalizarDatos([{ nombre: 'B' }])[0].nombre, 'B');
  assert.deepStrictEqual(C.normalizarDatos(null), []);
});

test('normalizarProyecto rellena lo que falte sin romperse', () => {
  const p = C.normalizarProyecto({ hitos: [{ fecha: 'fecha inválida' }] });
  assert.strictEqual(p.nombre, 'Proyecto sin nombre');
  assert.strictEqual(p.hitos[0].nombre, 'Paso sin nombre');
  assert.strictEqual(p.hitos[0].fecha, null);
  assert.ok(p.id && p.creado && p.color);
});

test('el valor del campo datetime-local va y vuelve sin correrse de hora', () => {
  const iso = C.desdeValorInput('2026-10-05T15:30');
  assert.strictEqual(C.aValorInput(iso), '2026-10-05T15:30');
  assert.strictEqual(C.aDate(iso).getHours(), 15);
  assert.strictEqual(C.desdeValorInput('cualquier cosa'), null);
});

test('formatearFecha no revienta con una fecha vacía', () => {
  assert.strictEqual(C.formatearFecha(null), 'Sin fecha');
});
