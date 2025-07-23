
const i18n = require("../../config/i18n-config");
const logger = require("../../config/logger");
const { SuggestionRepository, HomeRepository, FinanceRepository, BudgetRepository } = require("../repositories");
const FinancialAIService = require("../services/FinancesSuggestion");

const SuggestionController = {
  /**
   * Obtener todas las sugerencias.
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todas las sugerencias`);
    try {
      const suggestions = await SuggestionRepository.findAll();

      if (!suggestions.length) {
        return res.status(204).json({ msg: "SuggestionNotFound", suggestions: [] });
      }

      const mapped = suggestions.map(suggestion => ({
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        content: suggestion.content,
        status: suggestion.status,
        personId: suggestion.person_id,
        homeId: suggestion.home_id,
        home_id: suggestion.home_id,
        date: suggestion.date,
        type: suggestion.type,
        typeTask: suggestion.typeTask || 'Tarea'
      }));

      return res.status(200).json({ suggestions: mapped });
    } catch (error) {
      logger.error("SuggestionController->index: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  /**
   * Obtener una sugerencia por su ID.
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca una sugerencia`);
    try {
      const { id } = req.params;
      const suggestion = await SuggestionRepository.findById(id);

      if (!suggestion) {
        return res.status(204).json({ msg: "SuggestionNotFound" });
      }

      const result = {
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        content: suggestion.content,
        status: suggestion.status,
        personId: suggestion.person_id,
        homeId: suggestion.home_id,
        home_id: suggestion.home_id,
        date: suggestion.date,
        type: suggestion.type,
        typeTask: suggestion.typeTask || 'Tarea'
      };

      return res.status(200).json({ suggestion: result });
    } catch (error) {
      logger.error("SuggestionController->show: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  /**
   * Obtener sugerencias por persona autenticada.
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca sugerencias por persona`);
    try {
      const personId = req.person.id;
      const { date, home_id} = req.body
      const suggestions = await SuggestionRepository.findTodaySuggestions(null, personId, home_id);

      if (!suggestions.length) {
        return res.status(204).json({ msg: "SuggestionNotFound", suggestions: [] });
      }
      
      const mapped = suggestions.map(suggestion => ({
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        content: suggestion.content,
        status: i18n.__(`suggestionStatus.${suggestion.status}.name`) !== `suggestionStatus.${suggestion.status}.name`
                  ? i18n.__(`suggestionStatus.${suggestion.status}.name`)
                  : suggestion.status,
        homeId: suggestion.home_id,
        home_id: suggestion.home_id,
        date: suggestion.date,
        type: suggestion.type,
         taskData: Array.isArray(suggestion.taskData)
          ? suggestion.taskData // Si ya es un array, úsalo directamente
          : JSON.parse(suggestion.taskData), // Si es una cadena JSON, parsearla
        typeTask: suggestion.typeTask || 'Tarea'
      }));

      return res.status(200).json({ suggestions: mapped });
    } catch (error) {
      logger.error("SuggestionController->getByPersonId: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  /**
   * Crear una nueva sugerencia.
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva sugerencia`);
    logger.info("Datos recibidos:", JSON.stringify(req.body));
    try {
      req.body.person_id = req.person.id;
      const { home_id } = req.body;

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          logger.error(`Hogar no encontrado con ID ${home_id}`);
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      const suggestion = await SuggestionRepository.create(req.body);
      res.status(201).json({ suggestion });
    } catch (error) {
      logger.error("SuggestionController->store: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  /**
   * Actualizar una sugerencia.
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza sugerencia con ID ${req.body.id}`);
    logger.info("Datos recibidos:", JSON.stringify(req.body));
    const { id, home_id } = req.body;

    try {
      const suggestion = await SuggestionRepository.findById(id);

      if (!suggestion) {
        return res.status(404).json({ msg: "SuggestionNotFound" });
      }

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          logger.error(`Hogar no encontrado con ID ${home_id}`);
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      const updated = await SuggestionRepository.update(suggestion, req.body);
      res.status(200).json({ suggestion: updated });
    } catch (error) {
      logger.error("SuggestionController->update: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  /**
   * Eliminar una sugerencia.
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina sugerencia con ID ${req.body.id}`);
    const { id } = req.body;

    try {
      const suggestion = await SuggestionRepository.findById(id);

      if (!suggestion) {
        return res.status(404).json({ msg: "SuggestionNotFound" });
      }

      await SuggestionRepository.delete(suggestion);
      res.status(200).json({ msg: "SuggestionDeleted" });
    } catch (error) {
      logger.error("SuggestionController->destroy: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

   async generateAndGetSuggestions(req, res) {
    logger.info(`${req.user.name} - Se generan las sugerencias `);

    const person_id = req.person.id;
    const dateParam = req.body.date || new Date().toISOString().slice(0, 10);
    const home_id = req.body.home_id;

    try {

       const stats = await FinanceRepository.getPersonFinancialStats(person_id);
      
      // 2. Obtener presupuestos actuales
      const budgets = await BudgetRepository.findAllCurrentByPersonId(person_id, home_id);
      
      // 3. Verificar si ya hay sugerencias hoy
      const todaySuggestions = await SuggestionRepository.findTodaySuggestions(person_id, home_id);
      
      // 4. Generar nuevas sugerencias si no hay o son pocas
      let aiSuggestions = [];
      if (todaySuggestions.length === 0) { // Umbral para generar nuevas
        const aiResponse = await FinancialAIService.generateFinancialSuggestions(
          stats, 
          budgets, 
          todaySuggestions
        );
        aiSuggestions = aiResponse.suggestions || [];
        
        // Guardar nuevas sugerencias
        for (const suggestion of aiSuggestions) {
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
      }
      res.status(200).json({"msg": 'Sugerencias creadas correctamente'});
    } catch (error) {
      logger.error("SugestionController->getPersonFinancialStats: " + error.message);
      res.status(500).json({ 
        error: "ServerError", 
        message: "Error al obtener estadísticas financieras personales" 
      });
    }
  },
};

module.exports = SuggestionController;
