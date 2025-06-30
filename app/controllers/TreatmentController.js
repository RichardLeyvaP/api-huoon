const Joi = require("joi");
const { Treatment, Person, MedicalConsultation, sequelize } = require("../models");
const logger = require("../../config/logger");
const { TreatmentRepository, PersonRepository, MedicalConsultationRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");

const TreatmentController = {
  /**
   * Get all treatments
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Accessing treatment records`);
    try {
      const treatments = await TreatmentRepository.findAll();

      if (!treatments.length) {
        return res.status(204).json({ msg: "TreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((treatment) => ({
        id: treatment.id,
        personId: treatment.person_id,
        person_id: treatment.person_id,
        medicalConsultationId: treatment.medical_consultation_id,
        medical_consultation_id: treatment.medical_consultation_id,
        medication: treatment.medication,
        dosage: treatment.dosage,
        frequency: treatment.frequency,
        duration: treatment.duration,
        instructions: treatment.instructions,
        purpose: treatment.purpose,
        startDate: treatment.startDate,
        endDate: treatment.endDate,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get a treatment by ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Searching for treatment with ID ${req.body.id}`);
    try {
      const treatment = await TreatmentRepository.findById(req.body.id);

      if (!treatment) {
        return res.status(204).json({ msg: "TreatmentNotFound" });
      }

      const mappedTreatment = {
        id: treatment.id,
        personId: treatment.person_id,
        person_id: treatment.person_id,
        medicalConsultationId: treatment.medical_consultation_id,
        medical_consultation_id: treatment.medical_consultation_id,
        medication: treatment.medication,
        dosage: treatment.dosage,
        frequency: treatment.frequency,
        duration: treatment.duration,
        instructions: treatment.instructions,
        purpose: treatment.purpose,
        startDate: treatment.startDate,
        endDate: treatment.endDate,
      };

      return res.status(200).json({ treatment: mappedTreatment });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get treatments by person ID
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Searching treatments for person`);
    try {
      const treatments = await TreatmentRepository.findAllByPersonId(req.person.id);

      if (!treatments.length) {
        return res.status(204).json({ msg: "TreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((treatment) => ({
        id: treatment.id,
        medicalConsultationId: treatment.medical_consultation_id,
        medical_consultation_id: treatment.medical_consultation_id,
        medication: treatment.medication,
        dosage: treatment.dosage,
        frequency: treatment.frequency,
        duration: treatment.duration,
        instructions: treatment.instructions,
        purpose: treatment.purpose,
        startDate: treatment.startDate,
        endDate: treatment.endDate,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Create a new treatment
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Creating new treatment`);
    logger.debug("Received data:", req.body);

    req.body.person_id = req.person.id;

    // Verify medical consultation exists if provided
    if (req.body.medical_consultation_id) {
      const consultation = await MedicalConsultationRepository.findById(req.body.medical_consultation_id);
      if (!consultation) {
        logger.error(`Medical consultation not found with ID ${req.body.medical_consultation_id}`);
        return res.status(404).json({ msg: "MedicalConsultationNotFound" });
      }
    }

    const t = await sequelize.transaction();
    try {
      const treatment = await TreatmentRepository.create(req.body, t);
      await t.commit();
      
      res.status(201).json({ treatment });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Update a treatment
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Updating treatment with ID ${req.body.id}`);
    logger.debug("Received data:", req.body);

    try {
      const treatment = await TreatmentRepository.findById(req.body.id);

      if (!treatment) {
        return res.status(404).json({ msg: "TreatmentNotFound" });
      }

      // Verify medical consultation exists if provided
      if (req.body.medical_consultation_id) {
        const consultation = await MedicalConsultationRepository.findById(req.body.medical_consultation_id);
        if (!consultation) {
          logger.error(`Medical consultation not found with ID ${req.body.medical_consultation_id}`);
          return res.status(404).json({ msg: "MedicalConsultationNotFound" });
        }
      }

      const t = await sequelize.transaction();
      try {
        const updatedTreatment = await TreatmentRepository.update(
          treatment,
          req.body,
          t
        );
        await t.commit();
        
        res.status(200).json({ treatment: updatedTreatment });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Delete a treatment
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Deleting treatment with ID ${req.params.id}`);

    try {
      const treatment = await TreatmentRepository.findById(req.params.id);

      if (!treatment) {
        return res.status(404).json({ msg: "TreatmentNotFound" });
      }

      await TreatmentRepository.delete(treatment);

      res.status(200).json({ msg: "TreatmentDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get last treatment by person ID
   */
  async getLastByPersonId(req, res) {
    logger.info(`${req.user.name} - Searching last treatment for person`);

    try {
      const lastTreatment = await TreatmentRepository.getLastByPersonId(req.person.id);

      if (!lastTreatment) {
        return res.status(204).json({ msg: "TreatmentNotFound" });
      }

      res.status(200).json({ lastTreatment });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->getLastByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get active treatments by person ID
   */
  async getActiveTreatments(req, res) {
    logger.info(`${req.user.name} - Searching active treatments for person`);

    try {
      const activeTreatments = await TreatmentRepository.getActiveTreatments(req.person.id);

      if (!activeTreatments.length) {
        return res.status(204).json({ msg: "ActiveTreatmentsNotFound", treatments: [] });
      }

      res.status(200).json({ treatments: activeTreatments });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("TreatmentController->getActiveTreatments: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  }
};

module.exports = TreatmentController;