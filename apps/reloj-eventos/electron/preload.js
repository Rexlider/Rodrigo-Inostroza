/* Puente mínimo entre la interfaz y el proceso principal: solo lo que la app necesita. */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('relojEscritorio', {
  plataforma: process.platform,
  version: process.versions.electron,
  almacen: {
    ruta: () => ipcRenderer.invoke('almacen:ruta'),
    listar: () => ipcRenderer.invoke('almacen:listar'),
    guardarTodos: (lista) => ipcRenderer.invoke('almacen:guardar-todos', lista),
    leerPrefs: () => ipcRenderer.invoke('almacen:leer-prefs'),
    guardarPrefs: (prefs) => ipcRenderer.invoke('almacen:guardar-prefs', prefs),
    abrirCarpeta: () => ipcRenderer.invoke('almacen:abrir-carpeta')
  }
});
