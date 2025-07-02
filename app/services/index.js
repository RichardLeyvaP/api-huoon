// Exportar todos los servicios desde un solo archivo
module.exports = {
    CategoryService: require('./CategoryService'),
    StatusService: require('./StatusService'),
    RoleService: require('./RoleService'),
    ActivityLogService: require('./ActivityLogService'),
    IntentDetectionService: require('./IntentDetectionService'),
    // Agregar otros servicios según sea necesario
  };