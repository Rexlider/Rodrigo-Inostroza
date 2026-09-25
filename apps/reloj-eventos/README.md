# ⏳ Reloj de Eventos

Aplicación de escritorio que muestra **cuántas horas faltan** para tus fechas importantes.
No es una sola cuenta regresiva: cada proyecto puede tener **varios pasos consecutivos**, cada uno
con su nombre, su descripción y su fecha/hora.

Pensado para casos como una **licitación de Mercado Público**, donde no hay una sola fecha sino una
secuencia: publicación → cierre de preguntas → publicación de respuestas → **cierre de ofertas** →
apertura → adjudicación. También sirve para un cumpleaños, un trámite o la entrega de un proyecto.

![Pantalla principal del Reloj de Eventos](docs/captura.png)

## Bajarlo a tu computador (Windows)

**Lo más rápido — un solo archivo, sin instalar nada:**

1. Abre [`Reloj-de-Eventos.html`](https://github.com/Rexlider/Rodrigo-Inostroza/blob/claude/bold-brown-m0at4h/apps/reloj-eventos/Reloj-de-Eventos.html) en GitHub.
2. Arriba a la derecha, botón **Download raw file** (la flecha ⬇).
3. Guárdalo donde quieras, por ejemplo en `C:\Users\Ignacio\Desktop\app\`.
4. **Doble clic** y listo: el programa se abre.

Ese archivo lleva todo adentro (interfaz, estilos y código); se abre en tu navegador pero funciona
igual y sin internet.

**Con todo el proyecto (para la ventana propia y el instalador):**

1. Descarga el proyecto completo:
   [bajar ZIP](https://github.com/Rexlider/Rodrigo-Inostroza/archive/refs/heads/claude/bold-brown-m0at4h.zip)
2. Clic derecho → **Extraer todo**, por ejemplo en el Escritorio.
3. Entra a la carpeta `apps\reloj-eventos`. Ahí tienes tres archivos para hacer doble clic:

| Archivo | Para qué sirve | Necesita |
|---|---|---|
| `ABRIR-RELOJ.bat` | Abrir el programa al toque | nada |
| `INSTALAR-APP-ESCRITORIO.bat` | Dejarlo como app con ventana propia y avisos de Windows | [Node.js](https://nodejs.org) |
| `CREAR-INSTALADOR-WINDOWS.bat` | Generar el `.exe` instalable | [Node.js](https://nodejs.org) |

> La versión de un solo archivo guarda tus datos en el navegador. La app de escritorio los guarda
> como archivos en `datos/`, y la primera vez que la abras se trae solo lo que tuvieras del navegador.

## Qué hace

- **Cuenta regresiva en vivo**, actualizada cada segundo: `7d 23:59:53` y también las **horas totales** (`faltan 192 h`).
- **Varios pasos por proyecto**, cada uno con nombre, descripción y fecha/hora. Se ordenan solos cronológicamente.
- **Reloj destacado** arriba con el vencimiento más próximo de todos tus proyectos.
- **Semáforo de estados**: Programado · Esta semana · Últimas horas (menos de 24 h) · Vencido · Listo.
- **Marcar pasos cumplidos** con un clic; el reloj salta automáticamente al siguiente paso.
- **Plantillas** listas: Licitación Mercado Público, Cumpleaños, Trámite o postulación, Entrega de proyecto.
  Eliges la fecha de inicio y los pasos se acomodan solos.
- **Avisos de escritorio** 24 h antes, 1 h antes y al vencer cada paso (botón de la campana).
- **Buscador y filtros** (activos, urgentes, vencidos, completados), duplicar proyectos, tema claro/oscuro.
- **Respaldo**: exporta todo a un archivo `.json` y vuelve a importarlo en otro computador.
- **Tus datos son archivos tuyos**: cada proyecto queda en un `.json` legible dentro de `datos/proyectos/`.
- Funciona **sin internet**. Nada se sube a ninguna parte.

## Cómo usarla

### Opción 1 — Probarla al toque (sin instalar nada)

Doble clic en `Reloj-de-Eventos.html` (o en `ABRIR-RELOJ.bat`). Se abre en el navegador y funciona igual.

Ese archivo se arma solo a partir de `src/`, con:

```bash
npm run portable
```

### Opción 2 — Como app de escritorio (ventana propia, avisos del sistema)

Necesitas [Node.js](https://nodejs.org) instalado.

```bash
cd apps/reloj-eventos
npm install
npm start
```

### Opción 3 — Generar el instalador

```bash
npm run dist:win     # Windows: instalador .exe y versión portable
npm run dist:mac     # macOS: .dmg
npm run dist:linux   # Linux: .AppImage
```

El resultado queda en la carpeta `dist/`. Cada instalador se genera en su propio sistema operativo
(el de Windows se construye desde Windows, etc.).

## Cómo se usa el día a día

1. **+ Nuevo proyecto** (o `Ctrl/Cmd + N`) y le pones nombre: *"Licitación 1234-56-LE26 — Municipalidad de…"*.
2. Agregas un paso por cada fecha que tienes que cuidar, con **+ Agregar paso**. Cada paso lleva nombre,
   fecha/hora y una descripción opcional (por ejemplo: *"Subir oferta técnica y económica. No hay prórroga"*).
3. Guardas. La tarjeta muestra el paso siguiente y el tiempo que falta.
4. Cuando cumples un paso, haces clic en su círculo: queda tachado y el reloj pasa al siguiente.
5. Con la **campana** activas los avisos para que te avise aunque estés en otra cosa.

Para una licitación conviene partir desde **Plantillas → Licitación Mercado Público**: crea los seis
pasos típicos y después ajustas las fechas reales de las bases.

## Atajos

| Atajo | Qué hace |
|---|---|
| `Ctrl/Cmd + N` | Nuevo proyecto |
| `Ctrl/Cmd + E` | Exportar respaldo |
| Menú *Archivo* | Abrir carpeta de datos |
| `Esc` | Cerrar la ventana abierta |

## Dónde quedan los datos

En una carpeta `datos/` dentro de la misma carpeta de la aplicación, como archivos de texto que puedes
ver, copiar y respaldar a mano:

```
datos/
├── proyectos/
│   ├── licitacion-1234-56-le26__proy_abc123.json     un archivo por proyecto
│   └── cumpleanos-de-mama__proy_def456.json
├── preferencias.json                                 tema, filtro y avisos
└── LEEME.txt
```

La ruta exacta aparece siempre abajo en la aplicación, con un botón **Abrir carpeta**
(o desde el menú *Archivo → Abrir carpeta de datos*).

- **Para respaldar o cambiarte de computador**: copia la carpeta `datos/` completa, o usa
  **⋯ → Exportar respaldo** y después **Importar respaldo** en el otro equipo.
- **Si editas un archivo a mano** y queda mal escrito, la aplicación lo ignora y **no lo borra**,
  para que puedas corregirlo sin perder nada.
- Si instalas la app en una ruta protegida (por ejemplo *Archivos de programa*), donde Windows no deja
  escribir, los datos se guardan automáticamente en la carpeta de usuario y la ruta real igual se
  muestra abajo en la ventana.
- Abriendo `src/index.html` directo en el navegador (opción 1) no hay acceso a archivos, así que ahí se
  usa el almacenamiento del navegador. La primera vez que abras la app de escritorio, esos proyectos se
  trasladan solos a la carpeta `datos/`.

Estos archivos no se suben al repositorio: `.gitignore` los deja fuera.

## Estructura del código

```
apps/reloj-eventos/
├── src/
│   ├── index.html         estructura de la interfaz
│   ├── styles.css         estilos (tema oscuro y claro)
│   ├── core.js            lógica pura: cuentas regresivas, estados, plantillas, avisos
│   └── app.js             interfaz: dibujado, formulario, respaldo, eventos
├── electron/
│   ├── main.js            ventana de escritorio, menú en español, carpeta de datos
│   ├── almacen.js         guardado en archivos (un .json por proyecto)
│   └── preload.js         puente mínimo y seguro con la interfaz
├── test/
│   ├── core.test.js       pruebas de la lógica de fechas
│   └── almacen.test.js    pruebas del guardado en archivos
├── herramientas/
│   └── construir-portable.js   arma el Reloj-de-Eventos.html de un solo archivo
├── Reloj-de-Eventos.html       versión de un archivo, para abrir con doble clic
├── ABRIR-RELOJ.bat             lanzadores para Windows
├── datos/                 tus proyectos (se crea al usar la app, fuera del repositorio)
└── docs/captura.png
```

`core.js` no toca el DOM y `almacen.js` no depende de Electron: ambos se prueban solos.

## Pruebas

```bash
npm test
```

37 pruebas. Sobre la lógica de fechas: formato de cuenta regresiva y de horas, estados según lo que falta,
orden de los pasos, resumen y avance de cada proyecto, escalones de aviso, plantillas y respaldos. Sobre el
guardado en archivos: crear la carpeta, un archivo por proyecto, renombrar sin duplicar, eliminar,
preferencias aparte y no tocar archivos dañados. Y sobre la versión de un solo archivo: que esté al día
con `src/` y que el código no se corrompa al incrustarlo.

## Licencia

MIT.
