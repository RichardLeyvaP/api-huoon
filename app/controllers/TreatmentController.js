const Joi = require("joi");
const { Treatment, Person, MedicalConsultation, sequelize } = require("../models");
const logger = require("../../config/logger");
const { TreatmentRepository, PersonRepository, MedicalConsultationRepository, TypeRepository } = require("../repositories");
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
        typeId: treatment.type_id,
        type_id: treatment.type_id,
        medication: treatment.medication,
        dosage: treatment.dosage,
        frequency: treatment.frequency,
        duration: treatment.duration,
        instructions: treatment.instructions,
        purpose: treatment.purpose,
        startDate: treatment.startDate,
        endDate: treatment.endDate,
        typeName: treatment.type?.name ? 
                  (i18n.__(`types.${treatment.type.name}.name`) !== `types.${treatment.type.name}.name`
                    ? i18n.__(`types.${treatment.type.name}.name`)
                    : treatment.type.name)
                  : null,
        type: treatment.tipe?.name
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
        typeId: treatment.type_id,
        type_id: treatment.type_id,
        typeName: treatment.type?.name ? 
                  (i18n.__(`types.${treatment.type.name}.name`) !== `types.${treatment.type.name}.name`
                    ? i18n.__(`types.${treatment.type.name}.name`)
                    : treatment.type.name)
                  : null,
        type: treatment.tipe?.name
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
    const { person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    try {
      const treatments = await TreatmentRepository.findAllByPersonId(person_id);

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
        typeId: treatment.type_id,
        type_id: treatment.type_id,
        typeName: treatment.type?.name ? 
                  (i18n.__(`types.${treatment.type.name}.name`) !== `types.${treatment.type.name}.name`
                    ? i18n.__(`types.${treatment.type.name}.name`)
                    : treatment.type.name)
                  : null,
        type: treatment.tipe?.name
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
    logger.info(`${req.user.name} - Creando nuevo tratamiento`);
    logger.info("Datos recibidos:", req.body);
    logger.info(JSON.stringify(req.body));
    const { person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    req.body.person_id = person_id; // Asignar el ID de la persona autenticada

    // Verify medical consultation exists if provided
    if (req.body.medical_consultation_id) {
      const consultation = await MedicalConsultationRepository.findById(req.body.medical_consultation_id);
      if (!consultation) {
        logger.error(`Medical consultation not found with ID ${req.body.medical_consultation_id}`);
        return res.status(404).json({ msg: "MedicalConsultationNotFound" });
      }
    }

    if (req.body.type_id) {
      const type = await TypeRepository.findById(req.body.type_id);
      if (!type) {
        logger.error(`Type not found with ID ${req.body.type_id}`);
        return res.status(404).json({ msg: "TypeNotFound" });
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
    logger.info("Received data:");
    logger.info(JSON.stringify(req.body));

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

      if (req.body.type_id) {
      const type = await TypeRepository.findById(req.body.type_id);
      if (!type) {
        logger.error(`Type not found with ID ${req.body.type_id}`);
        return res.status(404).json({ msg: "TypeNotFound" });
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
    logger.info(`${req.user.name} - Deleting treatment with ID ${req.body.id}`);

    try {
      const treatment = await TreatmentRepository.findById(req.body.id);

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
  },

  async getTypesByType(req, res) {
    logger.info(`${req.user.name} - Buscando tipos de tipo ${req.body.type}`);

    try {
      const { type } = req.body; // Supongamos que el tipo viene en el cuerpo de la solicitud
      const types = await TypeRepository.findByType(type);

      if (!types || types.length === 0) {
        return res
          .status(404)
          .json({
            message: "No se encontraron tipos para el tipo especificado.",
          });
      }

      const frequencyMap = {
        "Cada 1 hora": 1,
        "Cada 2 horas": 2,
        "Cada 4 horas": 4,
        "Cada 6 horas": 6,
        "Cada 8 horas": 8,
        "Cada 12 horas": 12,
        "Una vez al día": 24,
        "Cada 48 horas": 48,
      };
      // Formatear los resultados para traducir name y description
      const formattedTypes = types.map((typeItem) => {
        const translatedName = i18n.__(`types.${typeItem.name}.name`) !==
              `types.${typeItem.name}.name`
              ? i18n.__(`types.${typeItem.name}.name`)
              : typeItem.name;

        const translatedDescription = i18n.__(`types.${typeItem.name}.name`) !==
              `types.${typeItem.name}.name`
              ? i18n.__(`types.${typeItem.name}.description`)
              : typeItem.description;

        return {
          ...typeItem.toJSON(), // Mantener todos los campos originales
          nameTranslated: translatedName, // Sobrescribir name con la traducción
          descriptionTranslated: translatedDescription, // Sobrescribir description con la traducción
        };
      });

      const sortedTypes = formattedTypes.sort((a, b) => {
        const hoursA = frequencyMap[a.name] || 9999;
        const hoursB = frequencyMap[b.name] || 9999;
        return hoursA - hoursB;
      });

      return res.status(200).json({ types: sortedTypes/*, relationships: translatedFamilyRelationsData*/ });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("TreatmentController->getTypesByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = TreatmentController;