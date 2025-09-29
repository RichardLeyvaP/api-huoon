const Joi = require("joi");
const logger = require("../../config/logger");
const { InitiativeRepository, PersonRepository, PriorityRepository, StatusRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");
const { sequelize } = require("../models")

const InitiativeController = {
  /**
   * Get all initiatives
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Accessing initiative records`);
    try {
      const initiatives = await InitiativeRepository.findAll();

      if (!initiatives.length) {
        return res.status(204).json({ msg: "InitiativesNotFound", initiatives: [] });
      }

      const mappedInitiatives = initiatives.map((initiative) => ({
        id: initiative.id,
        title: initiative.title,
        description: initiative.description,
        type: initiative.type,
        task_type: initiative.task_type,
        recurrence: initiative.recurrence,
        personId: initiative.person_id,
        priorityId: initiative.priority_id,
        priority_id: initiative.priority_id,
        parentId: initiative.parent_id,
        namePriority: i18n.__(`priority.${initiative.priority.name}.name`) !==
                      `priority.${initiative.priority.name}.name`
                        ? i18n.__(`priority.${initiative.priority.name}.name`)
                        : initiative.priority.name,
        status: initiative.status || null,
      }));

      return res.status(200).json({ initiatives: mappedInitiatives });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("InitiativeController->index: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get an initiative by ID
   */
  async show(req, res) {
    const { id } = req.params || req.body;
    if (!id) {
      return res.status(400).json({ msg: "InitiativeIdRequired" });
    }

    logger.info(`${req.user.name} - Searching for initiative with ID ${id}`);
    try {
      const initiative = await InitiativeRepository.findById(id);

      if (!initiative) {
        return res.status(404).json({ msg: "InitiativeNotFound" });
      }

      const mappedInitiative = {
        id: initiative.id,
        title: initiative.title,
        description: initiative.description,
        type: initiative.type,
        task_type: initiative.task_type,
        recurrence: initiative.recurrence,
        personId: initiative.person_id,
        priorityId: initiative.priority_id,
        priority_id: initiative.priority_id,
        parentId: initiative.parent_id,
        namePriority: i18n.__(`priority.${initiative.priority.name}.name`) !==
                      `priority.${initiative.priority.name}.name`
                        ? i18n.__(`priority.${initiative.priority.name}.name`)
                        : initiative.priority.name,
        status: initiative.status,
        parentTitle: initiative.parent?.title || null,
        childrenCount: initiative.children?.length || 0
      };

      return res.status(200).json({ initiative: mappedInitiative });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("InitiativeController->show: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get initiatives by person ID
   */
  async getByPersonId(req, res) {
    const { person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    logger.info(`${req.user.name} - Searching initiatives for person ID ${person_id}`);
    try {
      const initiatives = await InitiativeRepository.findAllByPersonId(person_id);

      if (!initiatives.length) {
        return res.status(204).json({ msg: "InitiativesNotFound", initiatives: [] });
      }

      const mappedInitiatives = initiatives.map((initiative) => ({
        id: initiative.id,
        title: initiative.title,
        description: initiative.description,
        type: initiative.type,
        task_type: initiative.task_type,
        recurrence: initiative.recurrence,
        priorityId: initiative.priority_id,
        priority_id: initiative.priority_id,
        parentId: initiative.parent_id,
        namePriority: i18n.__(`priority.${initiative.priority.name}.name`) !==
                      `priority.${initiative.priority.name}.name`
                        ? i18n.__(`priority.${initiative.priority.name}.name`)
                        : initiative.priority.name,
        status: initiative.status,
        parentTitle: initiative.parent?.title || null
      }));

      return res.status(200).json({ initiatives: mappedInitiatives });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("InitiativeController->getByPersonId: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Create a new initiative
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Creating new initiative`);
    logger.info("Received data:");
    logger.info(JSON.stringify(req.body));

    const { person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    req.body.person_id = person_id;

    // Validar relaciones opcionales
    if (req.body.priority_id) {
      const priority = await PriorityRepository.findById(req.body.priority_id);
      if (!priority) {
        logger.error(`Priority not found with ID ${req.body.priority_id}`);
        return res.status(404).json({ msg: "PriorityNotFound" });
      }
    }

    if (req.body.parent_id) {
      const parent = await InitiativeRepository.findById(req.body.parent_id);
      if (!parent) {
        logger.error(`Parent initiative not found with ID ${req.body.parent_id}`);
        return res.status(404).json({ msg: "ParentInitiativeNotFound" });
      }
    }

    const t = await sequelize.transaction();
    try {
      const initiative = await InitiativeRepository.create(req.body, t);
      await t.commit();
      return res.status(201).json({ initiative });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("InitiativeController->store: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Update an initiative
   */
  async update(req, res) {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ msg: "InitiativeIdRequired" });
    }

    logger.info(`${req.user.name} - Updating initiative with ID ${id}`);
    logger.info("Received data:");
    logger.info(JSON.stringify(req.body));

    try {
      const initiative = await InitiativeRepository.findById(id);
      if (!initiative) {
        return res.status(404).json({ msg: "InitiativeNotFound" });
      }

      // Validar relaciones si se envían
      if (req.body.priority_id !== undefined) {
        const priority = await PriorityRepository.findById(req.body.priority_id);
        if (!priority) {
          logger.error(`Priority not found with ID ${req.body.priority_id}`);
          return res.status(404).json({ msg: "PriorityNotFound" });
        }
      }

      if (req.body.parent_id !== undefined) {
        if (req.body.parent_id !== null) {
          const parent = await InitiativeRepository.findById(req.body.parent_id);
          if (!parent) {
            logger.error(`Parent initiative not found with ID ${req.body.parent_id}`);
            return res.status(404).json({ msg: "ParentInitiativeNotFound" });
          }
        }
      }

      const t = await sequelize.transaction();
      try {
        const updatedInitiative = await InitiativeRepository.update(initiative, req.body, t);
        await t.commit();
        return res.status(200).json({ initiative: updatedInitiative });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("InitiativeController->update: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Delete an initiative
   */
  async destroy(req, res) {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ msg: "InitiativeIdRequired" });
    }

    logger.info(`${req.user.name} - Deleting initiative with ID ${id}`);
    try {
      const initiative = await InitiativeRepository.findById(id);
      if (!initiative) {
        return res.status(404).json({ msg: "InitiativeNotFound" });
      }

      await InitiativeRepository.delete(initiative);
      return res.status(200).json({ msg: "InitiativeDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("InitiativeController->destroy: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get active initiatives for a person
   */
  async getActiveInitiatives(req, res) {
    const { person_id: bodyPersonId, status, task_type } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    logger.info(`${req.user.name} - Searching active initiatives`);
    try {
      const activeInitiatives = await InitiativeRepository.getActiveInitiatives(person_id, status, task_type);

      if (!activeInitiatives.length) {
        return res.status(204).json({ msg: "ActiveInitiativesNotFound", initiatives: [] });
      }

      const mappedInitiatives = activeInitiatives.map((initiative) => ({
        id: initiative.id,
        title: initiative.title,
        description: initiative.description,
        type: initiative.type,
        task_type: initiative.task_type,
        recurrence: initiative.recurrence,
        personId: initiative.person_id,
        priorityId: initiative.priority_id,
        priority_id: initiative.priority_id,
        parentId: initiative.parent_id,
        namePriority: i18n.__(`priority.${initiative.priority.name}.name`) !==
                      `priority.${initiative.priority.name}.name`
                        ? i18n.__(`priority.${initiative.priority.name}.name`)
                        : initiative.priority.name,
        status: initiative.status || null,
      }));

      return res.status(200).json({ initiatives: mappedInitiatives });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("InitiativeController->getActiveInitiatives: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  }
};

module.exports = InitiativeController;