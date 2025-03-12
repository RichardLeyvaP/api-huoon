const logger = require("../../config/logger"); // Importa el logger
const { TypeRepository } = require("../repositories"); // Importa el repositorio de Type
const i18n = require("../../config/i18n-config");

const TypeController = {
  // Listar tipos
  async index(req, res) {
    logger.info(`${req.user.name} - Accediendo a la lista de tipos`);

    try {
      const types = await TypeRepository.findAll();
      res.status(200).json({ types: types });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("Error en TypeController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear un nuevo tipo
  async store(req, res) {
    logger.info(`${req.user.name} - Creando un nuevo tipo`);

    try {
      const type = await TypeRepository.create(req.body);
      res.status(201).json({ msg: "TypeCreated", type });
    } catch (error) {
      logger.error("Error en TypeController->store: " + error.message);
      res.status(500).json({ error: "ServerError" });
    }
  },

  // Mostrar un tipo específico
  async show(req, res) {
    logger.info(`${req.user.name} - Accediendo a un tipo específico`);

    try {
      const type = await TypeRepository.findById(req.body.id);
      if (!type) {
        return res.status(204).json({ msg: "TypeNotFound" });
      }

      res.status(200).json({ type: type });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("TypeController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un tipo
  async update(req, res) {
    logger.info(`${req.user.name} - Editando un tipo`);

    try {
      const type = await TypeRepository.findById(req.body.id);
      if (!type) {
        return res.status(204).json({ msg: "TypeNotFound" });
      }

      const typeUpdate = await TypeRepository.update(type, req.body);
      res.status(200).json({ msg: "TypeUpdated", typeUpdate });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error(
        `TypeController->update: Error al actualizar el tipo: ${errorMsg}`
      );
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un tipo
  async destroy(req, res) {
    logger.info(`${req.user.name} - Eliminando un tipo`);

    try {
      const type = await TypeRepository.findById(req.body.id);
      if (!type) {
        return res.status(204).json({ msg: "TypeNotFound" });
      }

      await TypeRepository.delete(type);
      res.status(200).json({ msg: "TypeDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error(
        `TypeController->destroy: Error al eliminar el tipo: ${errorMsg}`
      );
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener tipos por tipo (Salud o Tarea)
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

      return res.status(200).json({ types: formattedTypes });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("TypeController->getTypesByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = TypeController;
