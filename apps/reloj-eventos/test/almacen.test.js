const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { crearAlmacen, nombreArchivo, esEscribible } = require('../electron/almacen.js');
const C = require('../src/core.js');

function carpetaTemporal() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reloj-'));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function proyecto(nombre, extra) {
  return C.normalizarProyecto(Object.assign({
    nombre: nombre,
    hitos: [{ nombre: 'Cierre de ofertas', fecha: new Date('2026-12-01T18:00:00Z').toISOString() }]
  }, extra));
}

test('guarda un archivo .json legible por proyecto', () => {
  const almacen = crearAlmacen(carpetaTemporal());
  const p = proyecto('Licitación 1234-56-LE26 — Municipalidad');
  almacen.guardarTodos([p]);

  const archivos = fs.readdirSync(almacen.carpetaProyectos);
  assert.strictEqual(archivos.length, 1);
  assert.match(archivos[0], /^licitacion-1234-56-le26-municipalidad__proy_/);

  const contenido = JSON.parse(fs.readFileSync(path.join(almacen.carpetaProyectos, archivos[0]), 'utf8'));
  assert.strictEqual(contenido.nombre, p.nombre);
  assert.strictEqual(contenido.hitos.length, 1);
});

test('listar devuelve lo guardado, ya normalizado', () => {
  const almacen = crearAlmacen(carpetaTemporal());
  almacen.guardarTodos([proyecto('Uno'), proyecto('Dos')]);
  const leidos = almacen.listar().map((p) => p.nombre).sort();
  assert.deepStrictEqual(leidos, ['Dos', 'Uno']);
  assert.ok(almacen.listar().every((p) => p.id && Array.isArray(p.hitos)));
});

test('renombrar un proyecto renombra su archivo, sin dejar duplicados', () => {
  const almacen = crearAlmacen(carpetaTemporal());
  const p = proyecto('Nombre viejo');
  almacen.guardarTodos([p]);
  p.nombre = 'Nombre nuevo';
  almacen.guardarTodos([p]);

  const archivos = fs.readdirSync(almacen.carpetaProyectos);
  assert.strictEqual(archivos.length, 1);
  assert.match(archivos[0], /^nombre-nuevo__/);
  assert.strictEqual(almacen.listar()[0].nombre, 'Nombre nuevo');
});

test('eliminar un proyecto borra su archivo', () => {
  const almacen = crearAlmacen(carpetaTemporal());
  const a = proyecto('Queda');
  const b = proyecto('Se va');
  almacen.guardarTodos([a, b]);
  almacen.guardarTodos([a]);
  assert.deepStrictEqual(almacen.listar().map((p) => p.nombre), ['Queda']);
  assert.strictEqual(fs.readdirSync(almacen.carpetaProyectos).length, 1);
});

test('un archivo dañado se ignora al leer y nunca se borra al guardar', () => {
  const almacen = crearAlmacen(carpetaTemporal());
  almacen.guardarTodos([proyecto('Bueno')]);
  const roto = path.join(almacen.carpetaProyectos, 'editado-a-mano__proy_roto.json');
  fs.writeFileSync(roto, '{ esto no es json');

  assert.deepStrictEqual(almacen.listar().map((p) => p.nombre), ['Bueno']);
  almacen.guardarTodos(almacen.listar());
  assert.ok(fs.existsSync(roto), 'el archivo ilegible debe quedar intacto');
});

test('no quedan archivos temporales dando vueltas', () => {
  const almacen = crearAlmacen(carpetaTemporal());
  almacen.guardarTodos([proyecto('Uno'), proyecto('Dos')]);
  almacen.guardarPrefs({ tema: 'claro' });
  const sueltos = fs.readdirSync(almacen.carpetaProyectos).concat(fs.readdirSync(almacen.carpeta));
  assert.ok(!sueltos.some((f) => f.endsWith('.tmp')));
});

test('las preferencias se guardan y se leen aparte de los proyectos', () => {
  const almacen = crearAlmacen(carpetaTemporal());
  assert.strictEqual(almacen.leerPrefs(), null);
  almacen.guardarPrefs({ tema: 'claro', filtro: 'urgentes', alertas: true, abiertos: ['proy_1'] });
  assert.deepStrictEqual(almacen.leerPrefs(), { tema: 'claro', filtro: 'urgentes', alertas: true, abiertos: ['proy_1'] });
});

test('una carpeta nueva se crea sola al guardar', () => {
  const destino = path.join(carpetaTemporal(), 'sub', 'datos');
  const almacen = crearAlmacen(destino);
  almacen.guardarTodos([proyecto('Primero')]);
  assert.ok(fs.existsSync(almacen.carpetaProyectos));
  assert.strictEqual(almacen.listar().length, 1);
});

test('listar no falla si la carpeta todavía no existe', () => {
  const almacen = crearAlmacen(path.join(carpetaTemporal(), 'aun-no'));
  assert.deepStrictEqual(almacen.listar(), []);
});

test('nombreArchivo limpia tildes, símbolos y largos', () => {
  const largo = nombreArchivo({ nombre: 'Á'.repeat(200), id: 'proy_x' });
  assert.ok(largo.length < 80);
  assert.strictEqual(nombreArchivo({ nombre: '¿Qué? / \\ *', id: 'proy_y' }), 'que__proy_y.json');
  assert.strictEqual(nombreArchivo({ nombre: '***', id: 'proy_z' }), 'proyecto__proy_z.json');
});

test('esEscribible distingue una carpeta usable de una imposible', () => {
  assert.strictEqual(esEscribible(path.join(carpetaTemporal(), 'nueva')), true);
  assert.strictEqual(esEscribible(path.join('/dev', 'null', 'datos')), false);
});
