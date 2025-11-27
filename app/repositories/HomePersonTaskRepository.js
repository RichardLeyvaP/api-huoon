// app/repositories/HomePersonTaskRepository.js
const { HomePersonTask, Person } = require("../models");
const logger = require("../../config/logger");

const HomePersonTaskRepository = {

  async getPeopleByTaskId(taskId) {
    try {
      const assignments = await HomePersonTask.findAll({
        where: { task_id: taskId },
        include: [{
          model: Person,
          as: 'person',
          attributes: ['id', 'name'] // ajusta los atributos que necesites
        }],
        raw: true,
        nest: true
      });

      // Devolver array de personas: [{ id, name }, ...]
      return assignments.map(a => a.person);
    } catch (error) {
      logger.error(`Error en HomePersonTaskRepository->getPeopleByTaskId (taskId: ${taskId}):`, error);
      throw new Error(`Error al obtener personas asignadas a la tarea: ${error.message}`);
    }
  }
};

module.exports = HomePersonTaskRepository;