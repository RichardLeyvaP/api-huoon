const Joi = require("joi");
const { Diagnosis, Person, MedicalConsultation, Type, sequelize } = require("../models");
const logger = require("../../config/logger");
const { DiagnosisRepository, PersonRepository, MedicalConsultationRepository, TypeRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");

const DiagnosisController = {
  /**
   * Get all diagnoses
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Accessing diagnosis records`);
    try {
      const diagnoses = await DiagnosisRepository.findAll();

      if (!diagnoses.length) {
        return res.status(204).json({ msg: "DiagnosesNotFound", diagnoses: [] });
      }

      const mappedDiagnoses = diagnoses.map((diagnosis) => ({
        id: diagnosis.id,
        personId: diagnosis.person_id,
        person_id: diagnosis.person_id,
        medicalConsultationId: diagnosis.medical_consultation_id,
        medical_consultation_id: diagnosis.medical_consultation_id,
        typeId: diagnosis.type_id,
        type_id: diagnosis.type_id,
        date: diagnosis.date,
        description: diagnosis.description,
        cie10_code: diagnosis.cie10_code,
        cie10Code: diagnosis.cie10_code,
        notes: diagnosis.notes,
        typeName: diagnosis.type?.name ? 
          (i18n.__(`types.${diagnosis.type.name}.name`) !== `types.${diagnosis.type.name}.name`
            ? i18n.__(`types.${diagnosis.type.name}.name`)
            : diagnosis.type.name)
          : null
      }));

      return res.status(200).json({ diagnoses: mappedDiagnoses });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("DiagnosisController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get a diagnosis by ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Searching for diagnosis with ID ${req.body.id}`);
    try {
      const diagnosis = await DiagnosisRepository.findById(req.body.id);

      if (!diagnosis) {
        return res.status(204).json({ msg: "DiagnosisNotFound" });
      }

      const mappedDiagnosis = {
        id: diagnosis.id,
        personId: diagnosis.person_id,
        person_id: diagnosis.person_id,
        medicalConsultationId: diagnosis.medical_consultation_id,
        medical_consultation_id: diagnosis.medical_consultation_id,
        typeId: diagnosis.type_id,
        type_id: diagnosis.type_id,
        date: diagnosis.date,
        description: diagnosis.description,
        cie10_code: diagnosis.cie10_code,
        cie10Code: diagnosis.cie10_code,
        notes: diagnosis.notes,
        typeName: diagnosis.type?.name ? 
          (i18n.__(`types.${diagnosis.type.name}.name`) !== `types.${diagnosis.type.name}.name`
            ? i18n.__(`types.${diagnosis.type.name}.name`)
            : diagnosis.type.name)
          : null
      };

      return res.status(200).json({ diagnosis: mappedDiagnosis });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("DiagnosisController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get diagnoses by person ID
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Searching diagnoses for person`);
    const { person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    try {
      const diagnoses = await DiagnosisRepository.findAllByPersonId(person_id);

      if (!diagnoses.length) {
        return res.status(204).json({ msg: "DiagnosesNotFound", diagnoses: [] });
      }

      const mappedDiagnoses = diagnoses.map((diagnosis) => ({
        id: diagnosis.id,
        medicalConsultationId: diagnosis.medical_consultation_id,
        medical_consultation_id: diagnosis.medical_consultation_id,
        typeId: diagnosis.type_id,
        type_id: diagnosis.type_id,
        date: diagnosis.date,
        description: diagnosis.description,
        cie10_code: diagnosis.cie10_code,
        cie10Code: diagnosis.cie10_code,
        notes: diagnosis.notes,
        typeName: diagnosis.type?.name ? 
          (i18n.__(`types.${diagnosis.type.name}.name`) !== `types.${diagnosis.type.name}.name`
            ? i18n.__(`types.${diagnosis.type.name}.name`)
            : diagnosis.type.name)
          : null
      }));

      return res.status(200).json({ diagnoses: mappedDiagnoses });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("DiagnosisController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Create a new diagnosis
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo diagnóstico`);
    logger.info(JSON.stringify(req.body));

    const { type_id, person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    req.body.person_id = person_id;

    // Verify type exists if provided
    if (type_id) {
      const type = await TypeRepository.findById(req.body.type_id);
      if (!type) {
        logger.error(`Type not found with ID ${req.body.type_id}`);
        return res.status(404).json({ msg: "TypeNotFound" });
      }
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
      const diagnosis = await DiagnosisRepository.create(req.body, t);
      await t.commit();
      
      res.status(201).json({ diagnosis });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("DiagnosisController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Update a diagnosis
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Updating diagnosis with ID ${req.body.id}`);
    logger.debug("Received data:", req.body);

    try {
      const diagnosis = await DiagnosisRepository.findById(req.body.id);

      if (!diagnosis) {
        return res.status(404).json({ msg: "DiagnosisNotFound" });
      }

      // Verify type exists if provided
      if (req.body.type_id) {
        const type = await TypeRepository.findById(req.body.type_id);
        if (!type) {
          logger.error(`Type not found with ID ${req.body.type_id}`);
          return res.status(404).json({ msg: "TypeNotFound" });
        }
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
        const updatedDiagnosis = await DiagnosisRepository.update(
          diagnosis,
          req.body,
          t
        );
        await t.commit();
        
        res.status(200).json({ diagnosis: updatedDiagnosis });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("DiagnosisController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Delete a diagnosis
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Deleting diagnosis with ID ${req.body.id}`);

    try {
      const diagnosis = await DiagnosisRepository.findById(req.body.id);

      if (!diagnosis) {
        return res.status(404).json({ msg: "DiagnosisNotFound" });
      }

      await DiagnosisRepository.delete(diagnosis);

      res.status(200).json({ msg: "DiagnosisDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("DiagnosisController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get last diagnosis by person ID
   */
  async getLastByPersonId(req, res) {
    logger.info(`${req.user.name} - Searching last diagnosis for person`);

    try {
      const lastDiagnosis = await DiagnosisRepository.getLastByPersonId(req.person.id);

      if (!lastDiagnosis) {
        return res.status(204).json({ msg: "DiagnosisNotFound" });
      }

      res.status(200).json({ lastDiagnosis });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("DiagnosisController->getLastByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
  async getTypesByTypeRelation(req, res) {
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

      /*const familyRelationsData = [
        { id: "Padre", name: "Padre", description: "Parentesco de padre" },
        { id: "Madre", name: "Madre", description: "Parentesco de madre" },
        { id: "Hijo/a", name: "Hijo/a", description: "Parentesco de hijo o hija" },
        { id: "Hermano/a", name: "Hermano/a", description: "Parentesco de hermano o hermana" },
        { id: "Abuelo/a", name: "Abuelo/a", description: "Parentesco de abuelo o abuela" },
        { id: "Tío/a", name: "Tío/a", description: "Parentesco de tío o tía" },
        { id: "Otro", name: "Otro", description: "Otro tipo de parentesco" }
      ];

      const translatedFamilyRelationsData = familyRelationsData.map((item) => ({
        id: item.id,
        name: i18n.__(`familyRelations.${item.id}.name`) !==
                `familyRelations.${item.id}.name`
                ? i18n.__(`familyRelations.${item.id}.name`)
                : item.name,
        description: i18n.__(`familyRelations.${item.id}.description`) !==
                `familyRelations.${item.id}.description`
                ? i18n.__(`familyRelations.${item.id}.description`)
                : item.description,
        relationName: item.name
      }));*/

      return res.status(200).json({ types: formattedTypes/*, relationships: translatedFamilyRelationsData*/ });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("TypeController->getTypesByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = DiagnosisController;