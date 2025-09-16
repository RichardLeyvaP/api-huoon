const logger = require("../../config/logger");
const { FamilyBackgroundRepository, TypeRepository, HomeRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");

const FamilyBackgroundController = {
  /**
   * Obtener todos los antecedentes familiares.
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todos los antecedentes familiares`);
    try {
      const backgrounds = await FamilyBackgroundRepository.findAll();

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "FamilyBackgroundNotFound", backgrounds: [] });
      }

      // Mapear los antecedentes para el formato de respuesta
      const mappedBackgrounds = backgrounds.map((background) => ({
        id: background.id,
        type_id: background.type_id,
        typeId: background.type_id,
        relationship: background.relationship,
        disease: background.disease,
        details: background.details,
        diagnosis_age: background.diagnosis_age,
        personId: background.person_id,
        person_id: background.person_id,
        homeId: background.home_id,
        home_id: background.home_id,
        typeName: background.type?.name,
        type: background.type?.name,
        date: background.date
      }));

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FamilyBackgroundController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener un antecedente familiar por su ID.
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca un antecedente familiar`);
    try {
      const { id } = req.params;

      const background = await FamilyBackgroundRepository.findById(id);

      if (!background) {
        return res.status(204).json({ msg: "FamilyBackgroundNotFound" });
      }

      // Mapear el antecedente para el formato de respuesta
      const mappedBackground = {
        id: background.id,
        type_id: background.type_id,
        typeId: background.type_id,
        relationship: background.relationship,
        disease: background.disease,
        details: background.details,
        diagnosis_age: background.diagnosis_age,
        personId: background.person_id,
        person_id: background.person_id,
        homeId: background.home_id,
        home_id: background.home_id,
        typeName: background.type?.name,
        type: background.type?.name,
        date: background.date
      };

      return res.status(200).json({ background: mappedBackground });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FamilyBackgroundController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener los antecedentes familiares de una persona específica.
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca antecedentes familiares de una persona`);
    try {
     const { person_id: bodyPersonId } = req.body;
        const personId = bodyPersonId || req.person.id;

      const backgrounds = await FamilyBackgroundRepository.findAllByPersonId(personId);

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "FamilyBackgroundNotFound", backgrounds: [] });
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
          relationship: background.relationship,
          disease: background.disease,
          details: background.details,
          diagnosis_age: background.diagnosis_age,
          personId: background.person_id,
          person_id: background.person_id,
          homeId: background.home_id,
          home_id: background.home_id,
          typeName: translatedName,
          type: background.type?.name,
          date: background.date
        };
      });

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FamilyBackgroundController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener antecedentes familiares por tipo
   */
  async getByType(req, res) {
    logger.info(`${req.user.name} - Busca antecedentes por tipo`);
    try {
      const { typeId } = req.params;
      const personId = req.person?.id; // Opcional

      const backgrounds = await FamilyBackgroundRepository.findByType(typeId, personId);

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "FamilyBackgroundNotFound", backgrounds: [] });
      }

      const mappedBackgrounds = backgrounds.map(background => ({
        id: background.id,
        type_id: background.type_id,
        relationship: background.relationship,
        disease: background.disease,
        diagnosis_age: background.diagnosis_age,
        personId: background.person_id,
        homeId: background.home_id,
        type: background.type?.name,
        date: background.date
      }));

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("FamilyBackgroundController->getByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener antecedentes familiares por parentesco
   */
  async getByRelationship(req, res) {
    logger.info(`${req.user.name} - Busca antecedentes por parentesco`);
    try {
      const { relationship } = req.params;
      const personId = req.person?.id; // Opcional

      const backgrounds = await FamilyBackgroundRepository.findByRelationship(relationship, personId);

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "FamilyBackgroundNotFound", backgrounds: [] });
      }

      const mappedBackgrounds = backgrounds.map(background => ({
        id: background.id,
        relationship: background.relationship,
        disease: background.disease,
        diagnosis_age: background.diagnosis_age,
        personId: background.person_id,
        homeId: background.home_id,
        type: background.type?.name,
        date: background.date
      }));

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("FamilyBackgroundController->getByRelationship: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener antecedentes familiares por enfermedad
   */
  async getByDisease(req, res) {
    logger.info(`${req.user.name} - Busca antecedentes por enfermedad`);
    try {
      const { disease } = req.params;
      const personId = req.person?.id; // Opcional

      const backgrounds = await FamilyBackgroundRepository.findByDisease(disease, personId);

      if (!backgrounds.length) {
        return res.status(204).json({ msg: "FamilyBackgroundNotFound", backgrounds: [] });
      }

      const mappedBackgrounds = backgrounds.map(background => ({
        id: background.id,
        relationship: background.relationship,
        disease: background.disease,
        diagnosis_age: background.diagnosis_age,
        personId: background.person_id,
        homeId: background.home_id,
        type: background.type?.name,
        date: background.date
      }));

      return res.status(200).json({ backgrounds: mappedBackgrounds });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("FamilyBackgroundController->getByDisease: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear un nuevo antecedente familiar.
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo antecedente familiar`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

    try {
      const { type_id, home_id, person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    req.body.person_id = person_id;

      // Verificar si el tipo existe (si se proporciona)
      if (type_id) {
        const type = await TypeRepository.findById(type_id);
        if (!type) {
          logger.error(`Tipo no encontrado con ID ${type_id}`);
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          logger.error(`Hogar no encontrado con ID ${home_id}`);
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

      const background = await FamilyBackgroundRepository.create(req.body);
      res.status(201).json({ background });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("FamilyBackgroundController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar un antecedente familiar existente.
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza antecedente con ID ${req.body.id}`);
    logger.info("Datos recibidos:", JSON.stringify(req.body));

    const { id, type_id } = req.body;

    try {
      const background = await FamilyBackgroundRepository.findById(id);

      if (!background) {
        return res.status(404).json({ msg: "FamilyBackgroundNotFound" });
      }

      // Verificar tipo si se está actualizando
      if (type_id) {
        const type = await TypeRepository.findById(type_id);
        if (!type) {
          logger.error(`Tipo no encontrado con ID ${type_id}`);
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

      const updatedData = await FamilyBackgroundRepository.update(background, req.body);
      res.status(200).json({ background: updatedData });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FamilyBackgroundController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar un antecedente familiar.
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina antecedente con ID ${req.body.id}`);

    const { id } = req.body;

    try {
      const background = await FamilyBackgroundRepository.findById(id);

      if (!background) {
        return res.status(404).json({ msg: "FamilyBackgroundNotFound" });
      }

      await FamilyBackgroundRepository.delete(background);
      res.status(200).json({ msg: "FamilyBackgroundDeleted" });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("FamilyBackgroundController->destroy: " + errorMsg);
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

      const familyRelationsData = [
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
      }));

      return res.status(200).json({ types: formattedTypes, relationships: translatedFamilyRelationsData });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("TypeController->getTypesByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = FamilyBackgroundController;