const logger = require("../../config/logger");
const { 
  FinanceRepository, 
  BudgetRepository, 
  SuggestionRepository, 
  DiagnosisRepository, 
  PersonalBackgroundRepository, 
  FamilyBackgroundRepository, 
  PhysicalExamRepository, 
  MedicalExamRepository, 
  TreatmentRepository, 
  MedicalConsultationRepository 
} = require("../repositories");
const FinancialAIService = require("./FinancesSuggestion");
const HealthAIService = require("./HealthAIService");

const SuggestionService = {
  async generateSuggestions(person_id, home_id) {
    try {
      logger.info(`Generando sugerencias para persona ${person_id} en hogar ${home_id}`);
      
      let totalSuggestions = 0;
      let generatedFinance = false;
      let generatedHealth = false;
      
      // 1. Generar sugerencias financieras
      const stats = await FinanceRepository.getPersonFinancialStats(person_id);
      const budgets = await BudgetRepository.findAllCurrentByPersonId(person_id, home_id);
      const todayFinanceSuggestions = await SuggestionRepository.findTodaySuggestions('Finanzas', person_id, home_id);
      
      if (todayFinanceSuggestions.length === 0) {
        const financeAIResponse = await FinancialAIService.generateFinancialSuggestions(stats, budgets, todayFinanceSuggestions);
        const financeSuggestions = financeAIResponse.suggestions || [];
        
        for (const suggestion of financeSuggestions) {
          await SuggestionRepository.create({
            person_id,
            home_id,
            title: suggestion.title,
            description: suggestion.description,
            content: suggestion.content,
            status: 'Pendiente',
            type: 'Finanzas',
            typeTask: suggestion.typeTask || 'Tarea'
          });
        }
        
        totalSuggestions += financeSuggestions.length;
        generatedFinance = true;
        logger.info(`Generadas ${financeSuggestions.length} sugerencias financieras`);
      }
      
      // 2. Generar sugerencias de salud
      const diagnoses = await DiagnosisRepository.findAllByPersonId(person_id);
      const backgrounds = await PersonalBackgroundRepository.findAllByPersonId(person_id);
      const backgroundsFamily = await FamilyBackgroundRepository.findAllByPersonId(person_id);
      const physicalExams = await PhysicalExamRepository.findAllByPersonId(person_id);
      const medicalExams = await MedicalExamRepository.findAllByPersonId(person_id);
      const treatments = await TreatmentRepository.findAllByPersonId(person_id);
      const medicalConsultations = await MedicalConsultationRepository.findAllByPersonId(person_id);
      
      const todayHealthSuggestions = await SuggestionRepository.findTodaySuggestions('Salud', person_id, home_id);
      
      if (todayHealthSuggestions.length === 0) {
        const healthAIResponse = await HealthAIService.generateHealthSuggestions(
          diagnoses,
          backgrounds,
          backgroundsFamily,
          physicalExams,
          medicalExams,
          treatments,
          medicalConsultations,
          todayHealthSuggestions
        );
        
        const healthSuggestions = healthAIResponse.suggestions || [];
        
        for (const suggestion of healthSuggestions) {
          await SuggestionRepository.create({
            person_id,
            home_id,
            title: suggestion.title,
            description: suggestion.description,
            content: suggestion.content,
            status: 'Pendiente',
            type: 'Salud',
            typeTask: suggestion.typeTask || 'Tarea'
          });
        }
        
        totalSuggestions += healthSuggestions.length;
        generatedHealth = true;
        logger.info(`Generadas ${healthSuggestions.length} sugerencias de salud`);
      }
      
      // 3. Determinar el mensaje de retorno apropiado
      if (generatedFinance || generatedHealth) {
        logger.info(`Total de sugerencias generadas: ${totalSuggestions}`);
        return totalSuggestions;
      } else {
        logger.info("No se generaron nuevas sugerencias (ya existían para hoy)");
        return 0;
      }
      
    } catch (error) {
      logger.error(`SuggestionService->generateSuggestions: ${error.message}`);
      return -1;
    }
  }
}

module.exports = SuggestionService;