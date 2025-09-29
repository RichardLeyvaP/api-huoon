const { Initiative, Person, Priority, Status, sequelize } = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");

const InitiativeRepository = {
  async findAll() {
    return await Initiative.findAll({
      attributes: [
        "id",
        "title",
        "description",
        "type",
        "priority_id",
        "status",
        "person_id",
        "parent_id",
        "recurrence",
        "task_type",
        "createdAt",
        "updatedAt"
      ],
      include: [
        { model: Priority, as: "priority" },
        { model: Person, as: "person" },
        { model: Initiative, as: "parent" }
        // Nota: no incluimos 'children' por defecto para evitar bucles o sobrecarga
      ],
      order: [["createdAt", "DESC"]]
    });
  },

  async findAllByPersonId(person_id) {
    return await Initiative.findAll({
      where: { person_id },
      attributes: [
        "id",
        "title",
        "description",
        "type",
        "priority_id",
        "status",
        "parent_id",
        "recurrence",
        "task_type",
        "createdAt",
        "updatedAt"
      ],
      include: [
        { model: Priority, as: "priority" },
        { model: Initiative, as: "parent" }
      ],
      order: [["createdAt", "DESC"]]
    });
  },

  async findById(id) {
    return await Initiative.findByPk(id, {
      attributes: [
        "id",
        "title",
        "description",
        "type",
        "priority_id",
        "status",
        "person_id",
        "parent_id",
        "recurrence",
        "task_type",
        "createdAt",
        "updatedAt"
      ],
      include: [
        { model: Priority, as: "priority" },
        { model: Person, as: "person" },
        { model: Initiative, as: "parent" },
        { model: Initiative, as: "children" }
      ]
    });
  },

  async create(body, t) {
    try {
      const newInitiative = await Initiative.create(
        {
          title: body.title,
          description: body.description || null,
          type: body.type || null,
          priority_id: body.priority_id || null,
          status: body.status || null,
          person_id: body.person_id || null,
          parent_id: body.parent_id || null,
          recurrence: body.recurrence || null,
          task_type: body.task_type || null
        },
        { transaction: t }
      );

      logger.info(`Iniciativa creada exitosamente (ID: ${newInitiative.id})`);
      return newInitiative;
    } catch (err) {
      logger.error(`Error en InitiativeRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(initiativeRecord, body, t) {
    const fieldsToUpdate = [
      "title",
      "description",
      "type",
      "priority_id",
      "status",
      "person_id",
      "parent_id",
      "recurrence",
      "task_type"
    ];
    const updatedData = {};

    try {
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      if (Object.keys(updatedData).length > 0) {
        await initiativeRecord.update(updatedData, { transaction: t });
        logger.info(`Iniciativa actualizada exitosamente (ID: ${initiativeRecord.id})`);
      }

      return initiativeRecord;
    } catch (err) {
      logger.error(`Error en InitiativeRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(initiativeRecord) {
    try {
      await initiativeRecord.destroy();
      logger.info(`Iniciativa eliminada exitosamente (ID: ${initiativeRecord.id})`);
      return initiativeRecord;
    } catch (err) {
      logger.error(`Error en InitiativeRepository->delete: ${err.message}`);
      throw err;
    }
  },

  // Ejemplo de método adicional: obtener iniciativas activas (ajusta según tu lógica de "activo")
  // Aquí asumimos que "activo" = status_id no es "finalizado" (por ejemplo, status_id !== 3)
  // Si necesitas otra lógica, modifícalo.
  async getActiveInitiatives(person_id , status, task_type) {
    // Asumiendo que los status "activos" son aquellos con status_id != 3 (por ejemplo)
    // Puedes ajustar esto según tu dominio
    return await Initiative.findAll({
      where: {
        status: status, // o usa un array de status permitidos
        task_type: task_type // o usa un array de status permitidos
      },
      attributes: [
        "id",
        "title",
        "description",
        "type",
        "priority_id",
        "status",
        "person_id",
        "parent_id",
        "recurrence",
        "task_type",
        "createdAt",
      ],
      include: [
        { model: Priority, as: "priority" }
      ],
      order: [["createdAt", "DESC"]]
    });
  }
};

module.exports = InitiativeRepository;