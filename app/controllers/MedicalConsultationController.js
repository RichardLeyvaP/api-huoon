const Joi = require("joi");
const { MedicalConsultation, Person } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger
const { MedicalConsultationRepository, PersonRepository } = require("../repositories");

const MedicalConsultationController = {
  /**
   * Obtener todas las consultas médicas.
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar las consultas médicas`); // Registro de la acción
    try {
      const medicalConsultations = await MedicalConsultationRepository.findAll();

      if (!medicalConsultations.length) {
        return res.status(204).json({ msg: "MedicalConsultationNotFound", medicalConsultations: [] });
      }

      // Mapear las consultas médicas para asegurar que los datos JSON estén en el formato correcto
      const mappedMedicalConsultations = medicalConsultations.map((consultation) => ({
        id: consultation.id,
        date: consultation.date,
        reason: consultation.reason,
        diagnosis: consultation.diagnosis,
        treatments: Array.isArray(consultation.treatments)
          ? consultation.treatments // Si ya es un array, úsalo directamente
          : JSON.parse(consultation.treatments || "[]"), // Si es una cadena JSON, parsearla
        medicalNotes: consultation.medicalNotes,
        files: Array.isArray(consultation.files)
          ? consultation.files // Si ya es un array, úsalo directamente
          : JSON.parse(consultation.files || "[]"), // Si es una cadena JSON, parsearla
        personId: consultation.person_id,
        person_id: consultation.person_id,
      }));

      return res.status(200).json({ medicalConsultations: mappedMedicalConsultations });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalConsultationController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener una consulta médica por su ID.
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca una consulta médica`); // Registro de la acción
    try {
      const { id } = req.params;

      // Consulta la consulta médica por su ID con las relaciones requeridas
      const medicalConsultation = await MedicalConsultationRepository.findById(id);

      // Validación de existencia de la consulta médica
      if (!medicalConsultation) {
        return res.status(204).json({ msg: "MedicalConsultationNotFound" });
      }

      // Mapear la consulta médica para asegurar que los datos JSON estén en el formato correcto
      const mappedMedicalConsultation = {
        id: medicalConsultation.id,
        date: medicalConsultation.date,
        reason: medicalConsultation.reason,
        diagnosis: medicalConsultation.diagnosis,
        treatments: Array.isArray(medicalConsultation.treatments)
          ? medicalConsultation.treatments // Si ya es un array, úsalo directamente
          : JSON.parse(medicalConsultation.treatments || "[]"), // Si es una cadena JSON, parsearla
        medicalNotes: medicalConsultation.medicalNotes,
        files: Array.isArray(medicalConsultation.files)
          ? medicalConsultation.files // Si ya es un array, úsalo directamente
          : JSON.parse(medicalConsultation.files || "[]"), // Si es una cadena JSON, parsearla
        personId: medicalConsultation.person_id,
        person_id: medicalConsultation.person_id,
      };

      // Respuesta JSON con los datos de la consulta médica
      return res.status(200).json({ medicalConsultation: mappedMedicalConsultation });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalConsultationController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener las consultas médicas de una persona específica.
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca las consultas médicas de una persona`); // Registro de la acción
    try {
      const personId = req.person.id;

      // Consulta las consultas médicas por el ID de la persona
      const medicalConsultations = await MedicalConsultationRepository.findAllByPersonId(personId);

      if (!medicalConsultations.length) {
        return res.status(204).json({ msg: "MedicalConsultationNotFound", medicalConsultations: [] });
      }

      // Mapear las consultas médicas para asegurar que los datos JSON estén en el formato correcto
      const mappedMedicalConsultations = medicalConsultations.map((consultation) => ({
        id: consultation.id,
        date: consultation.date,
        reason: consultation.reason,
        diagnosis: consultation.diagnosis,
        treatments: Array.isArray(consultation.treatments)
          ? consultation.treatments // Si ya es un array, úsalo directamente
          : JSON.parse(consultation.treatments || "[]"), // Si es una cadena JSON, parsearla
        medicalNotes: consultation.medicalNotes,
        files: Array.isArray(consultation.files)
          ? consultation.files // Si ya es un array, úsalo directamente
          : JSON.parse(consultation.files || "[]"), // Si es una cadena JSON, parsearla
        personId: consultation.person_id,
        person_id: consultation.person_id,
      }));

      return res.status(200).json({ medicalConsultations: mappedMedicalConsultations });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalConsultationController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear una nueva consulta médica.
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva consulta médica`);
    logger.info("Datos recibidos al crear una consulta médica");
    logger.info(JSON.stringify(req.body));

    const personId = req.person.id;
    try {
      const medicalConsultation = await MedicalConsultationRepository.create(req.body, personId, req.files);
      res.status(201).json({ medicalConsultation });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("MedicalConsultationController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar una consulta médica existente.
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza la consulta médica con ID ${req.params.id}`);
    logger.info("Datos recibidos al editar una consulta médica");
    logger.info(JSON.stringify(req.body));

    const { id } = req.body;
    // Buscar la consulta médica por ID
    const medicalConsultation = await MedicalConsultationRepository.findById(id);

    // Verificación de existencia
    if (!medicalConsultation) {
      return res.status(404).json({ msg: "MedicalConsultationNotFound" });
    }

    try {
      const updatedData = await MedicalConsultationRepository.update(medicalConsultation, req.body, req.files);
      res.status(200).json({ medicalConsultation: updatedData });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalConsultationController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar una consulta médica.
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina consulta médica con ID ${req.body.id}`);

    const { id } = req.body;

    // Buscar la consulta médica por ID
    const medicalConsultation = await MedicalConsultationRepository.findById(id);

    if (!medicalConsultation) {
      return res.status(404).json({ msg: "MedicalConsultationNotFound" });
    }

    try {
      await MedicalConsultationRepository.delete(medicalConsultation);
      res.status(200).json({ msg: "MedicalConsultationDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalConsultationController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = MedicalConsultationController;