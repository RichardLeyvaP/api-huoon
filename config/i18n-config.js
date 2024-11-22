const path = require('path');
const i18n = require('i18n');

// Configuración de i18n
i18n.configure({
    locales: ['en', 'es', 'pt'],  // Idiomas soportados
    directory: path.join(__dirname, '../locales'),  // Ruta al directorio principal 'locales'
    defaultLocale: 'es',  // Idioma por defecto
    objectNotation: true,  // Permite acceder a claves anidadas
    updateFiles: false,  // No actualiza archivos automáticamente
    syncFiles: true,  // Sincroniza archivos de traducción
    register: global,  // Registra las funciones globales para poder usarlas en cualquier parte
});

module.exports = i18n;
