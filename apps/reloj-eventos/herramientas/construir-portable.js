/*
 * Arma "Reloj-de-Eventos.html": un archivo único, con los estilos y el código
 * adentro, que funciona con doble clic sin instalar nada.
 *
 *   npm run portable
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SALIDA = path.join(RAIZ, 'Reloj-de-Eventos.html');

function leer(archivo) {
  return fs.readFileSync(path.join(RAIZ, 'src', archivo), 'utf8');
}

/** Devuelve el HTML de un solo archivo, con todo incrustado. */
function construir() {
  let html = leer('index.html');

  const reemplazos = [
    ['<link rel="stylesheet" href="styles.css">', '<style>\n' + leer('styles.css') + '\n</style>'],
    ['<script src="core.js"></' + 'script>', '<script>\n' + leer('core.js') + '\n</' + 'script>'],
    ['<script src="app.js"></' + 'script>', '<script>\n' + leer('app.js') + '\n</' + 'script>']
  ];

  reemplazos.forEach(function (par) {
    if (!html.includes(par[0])) {
      throw new Error('No se encontró en index.html la etiqueta: ' + par[0]);
    }
    // Con función de reemplazo: si no, String.replace interpreta $$ y $& del código.
    html = html.replace(par[0], function () { return par[1]; });
  });

  const aviso = '<!--\n' +
    '  Reloj de Eventos — versión de un solo archivo.\n' +
    '  Generado con "npm run portable"; no editar a mano: los cambios van en src/.\n' +
    '-->\n';

  return html.replace('<!DOCTYPE html>', function () { return '<!DOCTYPE html>\n' + aviso; });
}

if (require.main === module) {
  const html = construir();
  fs.writeFileSync(SALIDA, html, 'utf8');
  console.log('Listo: ' + SALIDA + ' (' + Math.round(html.length / 1024) + ' KB)');
}

module.exports = { construir, SALIDA };
