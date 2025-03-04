const Joi = require("joi");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const {
  Wish,
  Priority,
  Status,
  Person,
  Home,
  sequelize,
} = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger
const { StatusService } = require("../services");
const i18n = require("../../config/i18n-config");
const {
  WishRepository,
  HomeRepository,
  PriorityRepository,
  PersonRepository,
  StatusRepository,
} = require("../repositories");

const WishController = {
  // Obtener todos los deseos
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar los deseos`); // Registro de la acción
    try {
      // Obtener solo los deseos principales (sin padre) directamente en la consulta
      const wishes = await WishRepository.findAll();

      if (!wishes.length) {
        return res.status(204).json({ msg: "WishNotFound", wishes: wishes });
      }

      // Mapear los deseos
      const mappedWishes = await Promise.all(
        wishes.map(async (wish) => {
          return {
            id: wish.id,
            name: wish.name,
            description: wish.description,
            type: wish.type,
            date: wish.date,
            end: wish.end,
            location: wish.location,
            priorityId: wish.priority_id,
            priority_id: wish.priority_id,
            namePriority: wish.priority.name,
            colorPriority: wish.priority?.color,
            statusId: wish.status_id,
            status_id: wish.status_id,
            nameStatus: wish.status.name,
            homeId: wish.home_id,
            home_id: wish.home_id,
            parentId: wish.parent_id,
            parent_id: wish.parent_id,
            children: await WishRepository.mapChildren(
              wish.children,
              req.person.id
            ), // Espera el mapeo de hijos
          };
        })
      );

      return res.status(200).json({ wishes: mappedWishes }); // Deseos encontrados
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("WishController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getTypeWishes(req, res) {
    logger.info(`${req.user.name} - Entra a buscar los deseos por types`);

    const { home_id, type } = req.body;
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `WisheController->getHomeWishes : Hogar no encontrado con ID ${home_id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }
    const person_id = req.person.id;

    try {
      let wishes = [];
      if (type === "Hogar") {
        wishes = await WishRepository.findAllType(home_id, null, type);
      } else if (type === "Personal") {
        wishes = await WishRepository.findAllType(person_id, null, type);
      } else if (type === "Profesional") {
        wishes = await WishRepository.findAllType(person_id, null, type);
      } else {
        wishes = await WishRepository.findAllType(person_id, home_id, type);
      }

      if (!wishes.length) {
        return res.status(204).json({ msg: "wishesNotFound" });
      }

      // Mapear la respuesta
      const mappedwishes = await Promise.all(
        wishes.map(async (wish) => {
          return {
            id: wish.id,
            name: wish.name,
            description: wish.description,
            date: wish.date,
            end: wish.end,
            location: wish.location,
            priorityId: wish.priority_id,
            priority_id: wish.priority_id,
            namePriority: wish.priority.name,
            colorPriority: wish.priority?.color,
            statusId: wish.status_id,
            status_id: wish.status_id,
            nameStatus: wish.status.name,
            homeId: wish.home_id,
            home_id: wish.home_id,
            parentId: wish.parent_id,
            parent_id: wish.parent_id,
            children: await WishRepository.mapChildren(
              wish.children,
              req.person.id
            ), // Espera el mapeo de hijos
            type:
              i18n.__(`wishes.${wish.type}.name`) !== `wishes.${wish.type}.name`
                ? i18n.__(`wishes.${wish.type}.name`)
                : wish.type,
            idType: wish.type,
          };
        })
      );

      res.status(200).json({ wishes: mappedwishes });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("WishController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener un deseo por ID
  async show(req, res) {
    logger.info(`${req.user.name} - Busca un deseo`); // Registro de la acción
    try {
      const { id } = req.body;

      // Consulta el deseo por su ID con las relaciones requeridas
      const wish = await WishRepository.findById(id);

      // Validación de existencia del deseo
      if (!wish) {
        return res.status(204).json({ msg: "WishNotFound", wishes: wish });
      }

      // Mapeo de datos del deseo y sus relaciones
      const wishData = {
        id: wish.id,
        name: wish.name,
        description: wish.description,
        type: wish.type,
        date: wish.date,
        end: wish.end,
        location: wish.location,
        priorityId: wish.priority_id,
        colorPriority: wish.priority?.color,
        statusId: wish.status_id,
        personId: wish.person_id,
        homeId: wish.home_id,
        parentId: wish.parent_id,
        children: await WishRepository.mapChildren(
          wish.children,
          req.person.id
        ),
      };

      // Respuesta JSON con los datos del deseo
      return res.status(200).json({ wishes: [wishData] });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("WishController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear un nuevo deseo
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo deseo`);
    logger.info("Datos recibidos al crear un deseo");
    logger.info(JSON.stringify(req.body));
    const personId = req.person.id;

    const { date, home_id, priority_id } = req.body;

    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `WishController->store: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(204).json({ msg: "HomeNotFound" });
    }

    const priority = await PriorityRepository.findById(priority_id);
    if (!priority) {
      logger.error(
        `WishController->destroy: Prioridad no encontrada con ID ${req.body.id}`
      );
      return res.status(404).json({ msg: "PriorityNotFound" });
    }

    if (req.body.parent_id) {
      parent = await WishRepository.findById(req.body.parent_id);
      if (!parent) {
        logger.error(
          `WishController->store: Deseo no encontrado con ID ${req.body.parent_id}`
        );
        return res.status(404).json({ msg: "ParentNotFound" });
      }
    }

    const type = "Task";
    // Obtener todos los estados de tipo "Task"
    const statuses = await StatusRepository.findByType(type);

    if (!statuses || statuses.length === 0) {
      logger.info(`No se encontraron estados para el tipo: ${type}`);
      return res.status(404).json({
        message: `No se encontraron estados para el tipo: ${type}`,
      });
    }

    // Obtener la fecha y hora actual
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    let status;

    if (date > currentDate) {
      // Si la fecha de inicio es mayor que la fecha actual, filtrar por "Pendiente"
      status = statuses.find((s) => s.name === "Pendiente");
    } else if (date === currentDate) {
      status = statuses.find((s) => s.name === "En Progreso");
    } else {
      // Si la fecha es menor que la actual, filtrar por "Culminada"
      status = statuses.find((s) => s.name === "Completada");
    }

    if (!status) {
      logger.info(
        `No se encontró un estado válido para la fecha ${start_date}.`
      );
      return res.status(404).json({
        message: `No se encontró un estado válido para la fecha ${start_date}`,
      });
    }

    // Asignar el id del estado filtrado a req.body.status_id
    req.body.status_id = status.id;

    const t = await sequelize.transaction();
    try {
      const wish = await WishRepository.create(req.body, personId, t);

      await t.commit();
      res.status(201).json({ wish });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("WishController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un deseo
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza el deseo con ID ${req.body.id}`);
    logger.info("Datos recibidos al editar un deseo");
    logger.info(JSON.stringify(req.body));

    const { date, home_id, priority_id } = req.body;

    let wish = await WishRepository.findById(req.body.id);

    // Verificación de existencia
    if (!wish) {
      return res.status(400).json({ msg: "WishNotFound" });
    }

    if (
      req.body.parent_id !== undefined &&
      req.body.parent_id !== 0 &&
      req.body.parent_id !== null
    ) {
      parent = await WishRepository.findById(req.body.parent_id);
      if (!parent) {
        logger.error(
          `WishController->store: Deseo no encontrada con ID ${req.body.parent_id}`
        );
        return res.status(400).json({ msg: "ParentNotFound" });
      }
    }
    if (home_id) {
      // Verificar si el hogar existe
      const home = await HomeRepository.findById(home_id);
      if (!home) {
        logger.error(
          `WishController->update: Hogar no encontrado con ID ${home_id}`
        );
        return res.status(404).json({ msg: "HomeNotFound" });
      }
    }

    if (priority_id) {
      // Verificar si el hogar existe
      const priority = await PriorityRepository.findById(priority_id);
      if (!priority) {
        logger.error(
          `WishController->update: Prioridad no encontrada con ID ${priority_id}`
        );
        return res.status(404).json({ msg: "PriorityNotFound" });
      }
    }

    const t = await sequelize.transaction();
    try {
      const updatedData = await WishRepository.update(wish, req.body, t);

      // Llamada a ActivityLogService para registrar la actualización
      await t.commit();
      res.status(200).json({ wish: wish });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("WishController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un deseo
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina deseo con ID ${req.body.id}`);

    // Buscar el deseo por ID
    const wish = await WishRepository.findById(req.body.id);

    if (!wish) {
      return res.status(400).json({ msg: "WishNotFound" });
    }

    const t = await sequelize.transaction();
    try {
      const wishUpdate = await WishRepository.delete(wish, t);
      await t.commit();
      res.status(200).json({ msg: "WishDeleted" });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("WishController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  //Ruta unificada de Mantenedores
  async status_priority_type(req, res) {
    logger.info(`${req.user.name} - Entra a la ruta unificada de Deseos`);

    try {
      const statuses = await StatusService.getStatus("Task");
      const priorities = await WishController.getPriorities();

      const typeData = [
        { id: "Personal", name: "Personal" },
        { id: "Hogar", name: "Hogar" },
        { id: "Profesional", name: "Profesional" },
      ];

      const translatedTypeData = typeData.map((item) => {
        return {
          id: item.id, // El identificador único
          name: i18n.__(`wishes.${item.name}.name`), // La traducción del nombre
        };
      });

      res.json({
        wishstatus: statuses,
        wishpriorities: priorities,
        wishtype: translatedTypeData,
      });
    } catch (error) {
      logger.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías" });
    }
  },
  async getPriorities() {
    logger.info("Entra a Buscar Las prioridades en (status_priority_type)");
    try {
      const priorities = await PriorityRepository.findAll(); // Obtén todas las prioridades

      return priorities.map((priority) => {
        return {
          id: priority.id,
          namePriority:
            i18n.__(`priority.${priority.name}.name`) !==
            `priority.${priority.name}.name`
              ? i18n.__(`priority.${priority.name}.name`)
              : priority.name,
          descriptionPriority:
            i18n.__(`priority.${priority.name}.name`) !==
            `priority.${priority.name}.name`
              ? i18n.__(`priority.${priority.name}.description`)
              : priority.description,
          colorPriority: priority.color,
          level: priority.level,
        };
      });
    } catch (error) {
      logger.error("Error en getPriorities:", error);
      throw new Error("Error al obtener prioridades");
    }
  },
};

module.exports = WishController;
