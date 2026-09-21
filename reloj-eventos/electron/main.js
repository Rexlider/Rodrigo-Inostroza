/* Proceso principal de Electron: abre la ventana con la app y recuerda su tamaño. */
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const ID_APP = 'cl.rodrigoinostroza.relojeventos';
let ventana = null;

function rutaEstado() {
  return path.join(app.getPath('userData'), 'ventana.json');
}

function leerEstado() {
  try {
    const datos = JSON.parse(fs.readFileSync(rutaEstado(), 'utf8'));
    if (datos && Number.isFinite(datos.width) && Number.isFinite(datos.height)) return datos;
  } catch (e) { /* primera ejecución */ }
  return { width: 1180, height: 820 };
}

function guardarEstado() {
  if (!ventana || ventana.isDestroyed()) return;
  try {
    const b = ventana.getBounds();
    fs.writeFileSync(rutaEstado(), JSON.stringify({ ...b, maximizada: ventana.isMaximized() }));
  } catch (e) { /* si no se puede guardar, no es grave */ }
}

function crearVentana() {
  const estado = leerEstado();

  ventana = new BrowserWindow({
    width: estado.width,
    height: estado.height,
    x: estado.x,
    y: estado.y,
    minWidth: 720,
    minHeight: 560,
    title: 'Reloj de Eventos',
    backgroundColor: '#0b1120',
    show: false,
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (estado.maximizada) ventana.maximize();
  ventana.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
  ventana.once('ready-to-show', () => ventana.show());
  ventana.on('close', guardarEstado);
  ventana.on('closed', () => { ventana = null; });

  // Los enlaces externos se abren en el navegador, no dentro de la app.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function crearMenu() {
  const esMac = process.platform === 'darwin';
  const plantilla = [
    ...(esMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo proyecto',
          accelerator: 'CmdOrCtrl+N',
          click: () => ventana && ventana.webContents.executeJavaScript('document.getElementById("btnNuevo").click()')
        },
        {
          label: 'Exportar respaldo…',
          accelerator: 'CmdOrCtrl+E',
          click: () => ventana && ventana.webContents.executeJavaScript('document.querySelector("#menuMas [data-accion=exportar]").click()')
        },
        { type: 'separator' },
        esMac ? { role: 'close', label: 'Cerrar' } : { role: 'quit', label: 'Salir' }
      ]
    },
    { role: 'editMenu', label: 'Edición' },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'resetZoom', label: 'Tamaño normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de Reloj de Eventos',
          click: () => dialog.showMessageBox(ventana, {
            type: 'info',
            title: 'Reloj de Eventos',
            message: 'Reloj de Eventos ' + app.getVersion(),
            detail: 'Cuenta regresiva para proyectos y trámites con varios pasos.\n' +
              'Tus datos se guardan solo en este computador.'
          })
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(plantilla));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!ventana) return;
    if (ventana.isMinimized()) ventana.restore();
    ventana.focus();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId(ID_APP); // para que los avisos de Windows muestren el nombre correcto
    crearMenu();
    crearVentana();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) crearVentana();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
