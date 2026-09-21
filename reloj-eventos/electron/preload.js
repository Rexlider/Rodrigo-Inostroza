/* Puente mínimo: la interfaz solo necesita saber que corre como app de escritorio. */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('relojEscritorio', {
  plataforma: process.platform,
  version: process.versions.electron
});
