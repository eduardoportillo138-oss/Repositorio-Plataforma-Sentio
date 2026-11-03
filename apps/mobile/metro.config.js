// Expo (SDK 52+) detecta el monorepo automáticamente: vigila la raíz del workspace y
// resuelve node_modules de la app y de la raíz. Los paquetes @sentio/* se compilan desde TS.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
