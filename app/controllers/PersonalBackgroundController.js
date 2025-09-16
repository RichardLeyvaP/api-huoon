const logger = require("../../config/logger");
const { PersonalBackgroundRepository, TypeRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");

const PersonalBackgroundController = {
  /**
   * Obtener todos los antecedentes personales.
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todos los antecedentes personales`);
    try {
      const backgrounds = await PersonalBackgroundRepository.findAll();

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "PersonalBackgroundNotFound", backgrounds: [] });
      }

      // Mapear los antecedentes para el formato de respuesta
      const mappedBackgrounds = backgrounds.map((background) => ({
        id: background.id,
        type_id: background.type_id,
        typeId: background.type_id,
        description: background.description,
        details: background.details,
        startDate: background.startDate, // Formato YYYY-MM-DD
        endDate: background.endDate,
        status: background.status,
        severity: background.severity,
        personId: background.person_id,
        person_id: background.person_id,
        typeName: background.type?.name,
        typeDetail: background.typeDetail
      }));

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PersonalBackgroundController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener un antecedente personal por su ID.
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca un antecedente personal`);
    try {
      const { id } = req.body;

      const background = await PersonalBackgroundRepository.findById(id);

      if (!background) {
        return res.status(204).json({ msg: "PersonalBackgroundNotFound" });
      }

      // Mapear el antecedente para el formato de respuesta
      const mappedBackground = {
        id: background.id,
        type_id: background.type_id,
        typeId: background.type_id,
        description: background.description,
        details: background.details,
        startDate: background.startDate,
        endDate: background.endDate,
        status: background.status,
        severity: background.severity,
        personId: background.person_id,
        person_id: background.person_id,
        typeName: background.type?.name,
        typeDetail: background.typeDetail
      };

      return res.status(200).json({ background: mappedBackground });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PersonalBackgroundController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener los antecedentes personales de una persona específica.
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca antecedentes personales de una persona`);
    try {
      const { type, person_id: bodyPersonId } = req.body;
        const personId = bodyPersonId || req.person.id;

      const backgrounds = await PersonalBackgroundRepository.findByPersonIdType(personId, type);

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "PersonalBackgroundNotFound", backgrounds: [] });
      }

      // Mapear con traducción de nombres de tipo si es necesario
      const mappedBackgrounds = backgrounds.map((background) => {
        const translatedName = i18n.__(`types.${background.type?.name}.name`) !== `types.${background.type?.name}.name`
          ? i18n.__(`types.${background.type?.name}.name`)
          : background.type?.name;

        return {
          id: background.id,
          type_id: background.type_id,
          typeId: background.type_id,
          description: background.description,
          details: background.details,
          startDate: background.startDate,
          endDate: background.endDate,
          status: background.status,
          severity: background.severity,
          personId: background.person_id,
          person_id: background.person_id,
          typeName: translatedName,
          typeDetail: background.typeDetail
        };
      });

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PersonalBackgroundController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener antecedentes personales por tipo
   */
  async getByType(req, res) {
    logger.info(`${req.user.name} - Busca antecedentes por tipo`);
    try {
      const { typeId } = req.params;
      const personId = req.person?.id; // Opcional

      const backgrounds = await PersonalBackgroundRepository.findByType(typeId, personId);

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "PersonalBackgroundNotFound", backgrounds: [] });
      }

      const mappedBackgrounds = backgrounds.map(background => ({
        id: background.id,
        type_id: background.type_id,
        description: background.description,
        startDate: background.startDate,
        endDate: background.endDate,
        status: background.status,
        personId: background.person_id,
        typeDetail: background.typeDetail
      }));

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PersonalBackgroundController->getByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener antecedentes personales activos
   */
  async getActive(req, res) {
    logger.info(`${req.user.name} - Busca antecedentes activos`);
    try {
      const personId = req.person?.id; // Opcional

      const backgrounds = await PersonalBackgroundRepository.findActive(personId);

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "PersonalBackgroundNotFound", backgrounds: [] });
      }

      const mappedBackgrounds = backgrounds.map(background => ({
        id: background.id,
        type_id: background.type_id,
        description: background.description,
        startDate: background.startDate,
        status: background.status,
        personId: background.person_id,
        typeDetail: background.typeDetail
      }));

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PersonalBackgroundController->getActive: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear un nuevo antecedente personal.
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo antecedente personal`);
    logger.info(`Datos recibidos al crear un ${req.body.typeDetail} personal`);
    logger.info(JSON.stringify(req.body));

    try {
     const { type_id, person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    req.body.person_id = person_id; // Asignar el ID de la persona autenticada

      // Verificar si el tipo existe
      const type = await TypeRepository.findById(type_id);
      if (!type) {
        logger.error(`Tipo no encontrado con ID ${type_id}`);
        return res.status(404).json({ msg: "TypeNotFound" });
      }

      const background = await PersonalBackgroundRepository.create(req.body);
      res.status(201).json({ background });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PersonalBackgroundController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar un antecedente personal existente.
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza antecedente con ID ${req.body.id}`);
     logger.info(`Datos recibidos al editar un ${req.body.typeDetail} personal`);
    logger.info(JSON.stringify(req.body));

    const { id, type_id } = req.body;

    try {
      const background = await PersonalBackgroundRepository.findById(id);

      if (!background) {
        return res.status(404).json({ msg: "PersonalBackgroundNotFound" });
      }

      // Verificar tipo si se está actualizando
      if (type_id) {
        const type = await TypeRepository.findById(type_id);
        if (!type) {
          logger.error(`Tipo no encontrado con ID ${type_id}`);
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

      const updatedData = await PersonalBackgroundRepository.update(background, req.body);
      res.status(200).json({ background: updatedData });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PersonalBackgroundController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar un antecedente personal.
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina antecedente con ID ${req.body.id}`);

    const { id } = req.body;

    try {
      const background = await PersonalBackgroundRepository.findById(id);

      if (!background) {
        return res.status(404).json({ msg: "PersonalBackgroundNotFound" });
      }

      await PersonalBackgroundRepository.delete(background);
      res.status(200).json({ msg: "PersonalBackgroundDeleted" });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PersonalBackgroundController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
  async getTypesByTypeStateSeverity(req, res) {
    logger.info(`${req.user.name} - Buscando tipos de tipo ${req.body.type}`);

    try {
      const { type, query } = req.body; // Supongamos que el tipo viene en el cuerpo de la solicitud
      const types = await TypeRepository.findByTypeAndNameFilter(type, query);

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

    const severityData = [
      { id: "Leve", name: "Leve", description: "Antecedente de enfermedad con impacto leve en la salud" },
      { id: "Moderado", name: "Moderado", description: "Antecedente de enfermedad con impacto moderado en la salud" },
      { id: "Severo", name: "Severo", description: "Antecedente de enfermedad con impacto severo en la salud" }
    ];

    const translatedSeverityData = severityData.map((item) => ({
      id: item.id,
      name: i18n.__(`severity.${item.id}.name`) !==
              `severity.${item.id}.name`
              ? i18n.__(`severity.${item.id}.name`)
              : item.name,
        description: i18n.__(`severity.${item.id}.name`) !==
              `severity.${item.id}.name`
              ? i18n.__(`severity.${item.id}.description`)
              : item.description, // Buscará "severity.Leve.name", etc.
      severityName: item.name
    }));

    const statusData = [
      { id: "Activo", name: "Activo", description: "Estado activo" },
      { id: "Inactivo", name: "Inactivo", description: "Estado inactivo" },
      { id: "Resuelto", name: "Resuelto", description: "Estado resuelto" }
    ];

    const translatedStatusData = statusData.map((item) => ({
      id: item.id,
      name: i18n.__(`status.${item.id}.name`) !== `status.${item.id}.name`
            ? i18n.__(`status.${item.id}.name`)
            : item.name,
      description: i18n.__(`status.${item.id}.description`) !== `status.${item.id}.description`
            ? i18n.__(`status.${item.id}.description`)
            : item.description,
      originalName: item.name // Mantenemos el nombre original como referencia
    }));

      return res.status(200).json({ types: formattedTypes, status: translatedStatusData, severity: translatedSeverityData });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("TypeController->getTypesByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = PersonalBackgroundController;