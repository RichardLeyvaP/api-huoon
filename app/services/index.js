// Exportar todos los servicios desde un solo archivo
module.exports = {
    CategoryService: require('./CategoryService'),
    StatusService: require('./StatusService'),
    RoleService: require('./RoleService'),
    ActivityLogService: require('./ActivityLogService'),
    IntentDetectionService: require('./IntentDetectionService'),
    TaskSuggestionService: require('./TaskSuggestionService'),
    SuggestionService: require('./SuggestionService'),
    OCRProcessorService: require('./OCRProcessorService'),
    ImageService: require('./ImageService'),
    HealthAIService: require('./HealthAIService'),
    FinancesSuggestion: require('./FinancesSuggestion'),


    // Agregar otros servicios según sea necesario
  };