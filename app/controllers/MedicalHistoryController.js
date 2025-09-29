const Joi = require("joi");
const { MedicalHistory, Person } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger
const { MedicalHistoryRepository, PersonRepository } = require("../repositories");

const MedicalHistoryController = {
  /**
   * Obtener todos los historiales médicos.
   */
  /**
   * Obtener todos los historiales médicos.
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar los historiales médicos`); // Registro de la acción
    try {
      const medicalHistories = await MedicalHistoryRepository.findAll();

      if (!medicalHistories.length) {
        return res.status(204).json({ msg: "MedicalHistoryNotFound", medicalHistories: [] });
      }

      // Mapear los historiales médicos para asegurar que los datos JSON estén en el formato correcto
      const mappedMedicalHistories = medicalHistories.map((history) => ({
        id: history.id,
        familyBackground: history.familyBackground,
        personalBackground: history.personalBackground,
        bloodType: history.bloodType,
        vaccines: Array.isArray(history.vaccines)
          ? history.vaccines // Si ya es un array, úsalo directamente
          : JSON.parse(history.vaccines || "[]"), // Si es una cadena JSON, parsearla
        currentMedications: Array.isArray(history.currentMedications)
          ? history.currentMedications // Si ya es un array, úsalo directamente
          : JSON.parse(history.currentMedications || "[]"), // Si es una cadena JSON, parsearla
        personId: history.person_id,
        person_id: history.person_id,
      }));

      return res.status(200).json({ medicalHistories: mappedMedicalHistories });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalHistoryController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener un historial médico por su ID.
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca un historial médico`); // Registro de la acción
    try {
      const { id } = req.params;

      // Consulta el historial médico por su ID con las relaciones requeridas
      const medicalHistory = await MedicalHistoryRepository.findById(id);

      // Validación de existencia del historial médico
      if (!medicalHistory) {
        return res.status(204).json({ msg: "MedicalHistoryNotFound" });
      }

      // Mapear el historial médico para asegurar que los datos JSON estén en el formato correcto
      const mappedMedicalHistory = {
        id: medicalHistory.id,
        familyBackground: medicalHistory.familyBackground,
        personalBackground: medicalHistory.personalBackground,
        bloodType: medicalHistory.bloodType,
        vaccines: Array.isArray(medicalHistory.vaccines)
          ? medicalHistory.vaccines // Si ya es un array, úsalo directamente
          : JSON.parse(medicalHistory.vaccines || "[]"), // Si es una cadena JSON, parsearla
        currentMedications: Array.isArray(medicalHistory.currentMedications)
          ? medicalHistory.currentMedications // Si ya es un array, úsalo directamente
          : JSON.parse(medicalHistory.currentMedications || "[]"), // Si es una cadena JSON, parsearla
        personId: medicalHistory.person_id,
        person_id: medicalHistory.person_id,
      };

      // Respuesta JSON con los datos del historial médico
      return res.status(200).json({ medicalHistory: mappedMedicalHistory });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalHistoryController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener el historial clínico de una persona específica.
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca el historial clínico de una persona`); // Registro de la acción
    try {
        const personId = req.person.id;

      // Consulta el historial médico por el ID de la persona
      const medicalHistories = await MedicalHistoryRepository.findAllByPersonId(personId);

      if (!medicalHistories.length) {
        return res.status(204).json({ msg: "MedicalHistoryNotFound", medicalHistories: [] });
      }

      // Mapear los historiales médicos para asegurar que los datos JSON estén en el formato correcto
      const mappedMedicalHistories = medicalHistories.map((history) => ({
        id: history.id,
        familyBackground: history.familyBackground,
        personalBackground: history.personalBackground,
        bloodType: history.bloodType,
        vaccines: Array.isArray(history.vaccines)
          ? history.vaccines // Si ya es un array, úsalo directamente
          : JSON.parse(history.vaccines || "[]"), // Si es una cadena JSON, parsearla
        currentMedications: Array.isArray(history.currentMedications)
          ? history.currentMedications // Si ya es un array, úsalo directamente
          : JSON.parse(history.currentMedications || "[]"), // Si es una cadena JSON, parsearla
        personId: history.person_id,
        person_id: history.person_id,
      }));

      return res.status(200).json({ medicalHistories: mappedMedicalHistories });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalHistoryController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear un nuevo historial médico.
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo historial médico`);
    logger.info("Datos recibidos al crear un historial médico");
    logger.info(JSON.stringify(req.body));

    const personId = req.person.id;

    try {
      const medicalHistory = await MedicalHistoryRepository.create(req.body, personId);
      res.status(201).json({ medicalHistory });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("MedicalHistoryController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar un historial médico existente.
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza el historial médico con ID ${req.body.id}`);
    logger.info("Datos recibidos al editar un historial médico");
    logger.info(JSON.stringify(req.body));

    const { id } = req.body;
    // Buscar el historial médico por ID
    const medicalHistory = await MedicalHistoryRepository.findById(id);

    // Verificación de existencia
    if (!medicalHistory) {
      return res.status(404).json({ msg: "MedicalHistoryNotFound" });
    }

    try {
      const updatedData = await MedicalHistoryRepository.update(medicalHistory, req.body);
      res.status(200).json({ medicalHistory: updatedData });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalHistoryController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar un historial médico.
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina historial médico con ID ${req.body.id}`);

    const { id } = req.body;

    // Buscar el historial médico por ID
    const medicalHistory = await MedicalHistoryRepository.findById(id);

    if (!medicalHistory) {
      return res.status(404).json({ msg: "MedicalHistoryNotFound" });
    }

    try {
      await MedicalHistoryRepository.delete(medicalHistory);
      res.status(200).json({ msg: "MedicalHistoryDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalHistoryController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = MedicalHistoryController;