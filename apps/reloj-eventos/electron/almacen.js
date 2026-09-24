/*
 * Almacén en archivos: guarda cada proyecto como un .json legible dentro de
 * la carpeta de datos, para poder verlos, copiarlos y respaldarlos a mano.
 *
 * No depende de Electron: recibe la carpeta y usa solo Node, así se puede probar.
 */
const fs = require('fs');
const path = require('path');
const C = require('../src/core.js');

const CARPETA_PROYECTOS = 'proyectos';
const ARCHIVO_PREFS = 'preferencias.json';

/** Nombre de archivo legible y estable: "cierre-licitacion__proy_abc123.json". */
function nombreArchivo(proyecto) {
  const base = String(proyecto.nombre || 'proyecto')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'proyecto';
  return base + '__' + String(proyecto.id).replace(/[^a-zA-Z0-9_-]/g, '') + '.json';
}

/** Escribe primero un temporal y después renombra, para no dejar archivos a medias. */
function escribirAtomico(destino, contenido) {
  const temporal = destino + '.tmp';
  fs.writeFileSync(temporal, contenido, 'utf8');
  fs.renameSync(temporal, destino);
}

function leerJSON(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function crearAlmacen(carpeta) {
  const dirProyectos = path.join(carpeta, CARPETA_PROYECTOS);
  const rutaPrefs = path.join(carpeta, ARCHIVO_PREFS);

  function asegurarCarpeta() {
    fs.mkdirSync(dirProyectos, { recursive: true });
  }

  function archivosJSON() {
    try {
      return fs.readdirSync(dirProyectos).filter((f) => f.endsWith('.json'));
    } catch (e) {
      return [];
    }
  }

  function listar() {
    asegurarCarpeta();
    const proyectos = [];
    archivosJSON().forEach((archivo) => {
      try {
        proyectos.push(C.normalizarProyecto(leerJSON(path.join(dirProyectos, archivo))));
      } catch (e) {
        // Un archivo dañado o editado a mano no puede tumbar la app: se ignora y se avisa.
        console.warn('No se pudo leer el proyecto ' + archivo + ': ' + e.message);
      }
    });
    return C.ordenarProyectos(proyectos, Date.now());
  }

  function guardarTodos(lista) {
    asegurarCarpeta();
    const proyectos = C.normalizarDatos(lista);
    const esperados = new Map();
    proyectos.forEach((p) => esperados.set(nombreArchivo(p), p));

    esperados.forEach((proyecto, archivo) => {
      const destino = path.join(dirProyectos, archivo);
      const contenido = JSON.stringify(proyecto, null, 2) + '\n';
      let actual = null;
      try { actual = fs.readFileSync(destino, 'utf8'); } catch (e) { /* aún no existe */ }
      if (actual !== contenido) escribirAtomico(destino, contenido);
    });

    // Borra lo que ya no corresponde (proyectos eliminados o renombrados).
    // Un archivo ilegible se deja tal cual: nunca se borra algo que no se pudo entender.
    archivosJSON().forEach((archivo) => {
      if (esperados.has(archivo)) return;
      const ruta = path.join(dirProyectos, archivo);
      try {
        if (!leerJSON(ruta).id) return;
      } catch (e) {
        return;
      }
      fs.unlinkSync(ruta);
    });

    return proyectos.length;
  }

  function leerPrefs() {
    try {
      return leerJSON(rutaPrefs);
    } catch (e) {
      return null;
    }
  }

  function guardarPrefs(prefs) {
    asegurarCarpeta();
    escribirAtomico(rutaPrefs, JSON.stringify(prefs || {}, null, 2) + '\n');
    return true;
  }

  return {
    carpeta: carpeta,
    carpetaProyectos: dirProyectos,
    listar: listar,
    guardarTodos: guardarTodos,
    leerPrefs: leerPrefs,
    guardarPrefs: guardarPrefs
  };
}

/** ¿Se puede escribir realmente en esta carpeta? (Program Files, por ejemplo, no). */
function esEscribible(carpeta) {
  try {
    fs.mkdirSync(carpeta, { recursive: true });
    const prueba = path.join(carpeta, '.permiso-' + Date.now());
    fs.writeFileSync(prueba, 'ok');
    fs.unlinkSync(prueba);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { crearAlmacen, nombreArchivo, esEscribible, CARPETA_PROYECTOS, ARCHIVO_PREFS };
