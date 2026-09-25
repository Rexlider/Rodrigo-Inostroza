const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const { construir, SALIDA } = require('../herramientas/construir-portable.js');

test('el archivo Reloj-de-Eventos.html está al día con src/', () => {
  assert.ok(fs.existsSync(SALIDA), 'falta el archivo: corre "npm run portable"');
  assert.strictEqual(
    fs.readFileSync(SALIDA, 'utf8'),
    construir(),
    'el archivo de un solo archivo quedó viejo: corre "npm run portable" y súbelo'
  );
});

test('no le quedan archivos externos por cargar', () => {
  const html = construir();
  assert.ok(!html.includes('href="styles.css"'));
  assert.ok(!html.includes('src="core.js"'));
  assert.ok(!html.includes('src="app.js"'));
  assert.ok(html.includes('<style>') && html.includes('RelojCore'));
});

test('el código incrustado no se corrompe al armarlo', () => {
  // String.replace interpreta $$ y $& en el texto de reemplazo: esto lo vigila.
  const html = construir();
  const fuente = fs.readFileSync(require('node:path').join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert.ok(fuente.includes('var $$ = function'), 'cambió el atajo $$ en app.js');
  assert.ok(html.includes('var $$ = function'), 'el atajo $$ se perdió al incrustar el código');
  assert.ok(html.includes("replace(/'/g, '&#39;')"), 'se corrompió una expresión con $');
});
