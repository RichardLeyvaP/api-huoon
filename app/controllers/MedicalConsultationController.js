const Joi = require("joi");
const { MedicalConsultation, Person } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger
const { MedicalConsultationRepository, PersonRepository, TypeRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");
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
      const mappedMedicalConsultations = medicalConsultations.map((consultation) => {
        const translatedTypeName =
          i18n.__(`types.${consultation.type?.name}.name`) !==
          `types.${consultation.type?.name}.name`
            ? i18n.__(`types.${consultation.type?.name}.name`)
            : consultation.type?.name;

        return {
          id: consultation.id,
          date: consultation.date,
          reason: consultation.reason,
          diagnosis: consultation.diagnosis,
          treatments: Array.isArray(consultation.treatments)
            ? consultation.treatments
            : JSON.parse(consultation.treatments || "[]"),
          medicalNotes: consultation.medicalNotes,
          files: Array.isArray(consultation.files)
            ? consultation.files
            : JSON.parse(consultation.files || "[]"),
          personId: consultation.person_id,
          person_id: consultation.person_id,
          
          // Nuevos campos agregados
          professional: consultation.professional, // Asumiendo que professional es un string
          typeId: consultation.type_id,
          type_id: consultation.type_id,
          typeName: translatedTypeName, // Nombre del tipo traducido
        };
      });

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
      const { id } = req.body;

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
          ? medicalConsultation.treatments
          : JSON.parse(medicalConsultation.treatments || "[]"),
        medicalNotes: medicalConsultation.medicalNotes,
        files: Array.isArray(medicalConsultation.files)
          ? medicalConsultation.files
          : JSON.parse(medicalConsultation.files || "[]"),
        personId: medicalConsultation.person_id,
        person_id: medicalConsultation.person_id,
        
        // Nuevos campos agregados
        professional: medicalConsultation.professional, // Campo professional como string
        typeId: medicalConsultation.type_id,
        type_id: medicalConsultation.type_id,
        typeName: (
          i18n.__(`types.${medicalConsultation.type?.name}.name`) !== 
          `types.${medicalConsultation.type?.name}.name`
        ) 
          ? i18n.__(`types.${medicalConsultation.type?.name}.name`)
          : medicalConsultation.type?.name,
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
    const { person_id: bodyPersonId } = req.body;
        const personId = bodyPersonId || req.person.id;
    try {

      // Consulta las consultas médicas por el ID de la persona
      const medicalConsultations = await MedicalConsultationRepository.findAllByPersonId(personId);

      if (!medicalConsultations.length) {
        return res.status(204).json({ msg: "MedicalConsultationNotFound", medicalConsultations: [] });
      }

      // Mapear las consultas médicas para asegurar que los datos JSON estén en el formato correcto
      const mappedMedicalConsultations = medicalConsultations.map((consultation) => {
        const translatedTypeName =
          i18n.__(`types.${consultation.type?.name}.name`) !==
          `types.${consultation.type?.name}.name`
            ? i18n.__(`types.${consultation.type?.name}.name`)
            : consultation.type?.name;

        return {
          id: consultation.id,
          date: consultation.date,
          reason: consultation.reason,
          diagnosis: consultation.diagnosis,
          treatments: Array.isArray(consultation.treatments)
            ? consultation.treatments
            : JSON.parse(consultation.treatments || "[]"),
          medicalNotes: consultation.medicalNotes,
          files: Array.isArray(consultation.files)
            ? consultation.files
            : JSON.parse(consultation.files || "[]"),
          personId: consultation.person_id,
          person_id: consultation.person_id,
          
          // Nuevos campos agregados
          professional: consultation.professional, // Asumiendo que professional es un string
          typeId: consultation.type_id,
          type_id: consultation.type_id,
          typeName: translatedTypeName, // Nombre del tipo traducido
          type: consultation.type?.name
        };
      });

      return res.status(200).json({ consultations: mappedMedicalConsultations });
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

   const { type_id, person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    req.body.person_id = person_id;
     if (type_id) {
      const type = await TypeRepository.findById(type_id);
      if (!type) {
        logger.error(
          `MedicalConsultationController->store: Tipo de examen no encontrado con ID ${type_id}`
        );
        return res.status(404).json({ msg: "TypeNotFound" });
      }
    }
    try {
      const medicalConsultation = await MedicalConsultationRepository.create(req.body, req.files);
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
    logger.info(`${req.user.name} - Actualiza la consulta médica con ID ${req.body.id}`);
    logger.info("Datos recibidos al editar una consulta médica");
    logger.info(JSON.stringify(req.body));

    const { id } = req.body;
    // Buscar la consulta médica por ID
    const medicalConsultation = await MedicalConsultationRepository.findById(id);

    // Verificación de existencia
    if (!medicalConsultation) {
      return res.status(404).json({ msg: "MedicalConsultationNotFound" });
    }
    const { type_id} = req.body;
    if (type_id) {
      const type = await TypeRepository.findById(type_id);
      if (!type) {
        logger.error(
          `MedicalConsultationController->update: Tipo de examen no encontrado con ID ${type_id}`
        );
        return res.status(404).json({ msg: "TypeNotFound" });
      }
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

module.exports = MedicalConsultationController;