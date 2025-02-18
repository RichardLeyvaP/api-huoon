const { Op } = require("sequelize");
const { Role, Home, HomePerson, Person } = require("../models");
const logger = require("../../config/logger"); // Logger para seguimiento

const HomePersonRepository = {
  async addPointsToPersonInHome(home_id, person_id, points) {
    try {
      // Busca el registro en la tabla home_person
      const homePerson = await HomePerson.findOne({
        where: {
          home_id,
          person_id,
        },
      });

      if (homePerson) {
        // Suma los puntos al valor actual
        homePerson.points += points;
        homePerson.interactions += 1;

        // Guarda los cambios en la base de datos
        await homePerson.save();
      }

      return homePerson;
    } catch (error) {
      logger.error("Error al sumar puntos:", error);
      throw error;
    }
  },

  async updatePointsForPersonInHome(
    home_id,
    person_id,
    pointsToSubtract,
    pointsToAdd
  ) {
    try {
      // Busca el registro en la tabla home_person
      const homePerson = await HomePerson.findOne({
        where: {
          home_id,
          person_id,
        },
      });

      if (homePerson) {
        // Resta los puntos a restar y suma los puntos a agregar
        homePerson.points -= pointsToSubtract;
        homePerson.points += pointsToAdd;

        // Guarda los cambios en la base de datos
        await homePerson.save();
      }

      return homePerson;
    } catch (error) {
      logger.error("Error al actualizar puntos:", error);
      throw error;
    }
  },

  async update(homePerson, body, t = null) {
    try {
      // Lista de campos que pueden ser actualizados
      const fieldsToUpdate = ["role_id", "points"];

      // Filtrar los campos presentes en req.body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Si se proporciona "points", sumarlo al valor actual
      if (body.points !== undefined) {
        updatedData.points = homePerson.points + body.points;
      }

      // Actualizar solo si hay datos que cambiar
      if (Object.keys(updatedData).length > 0) {
        await homePerson.update(updatedData, { transaction: t });
        logger.info(
          `HomePerson actualizado exitosamente: (ID: ${homePerson.id})`
        );
      }

      return homePerson;
    } catch (error) {
      logger.error(`Error al editar HomePerson: ${error.message}`);
      throw error;
    }
  },

  async createPointsById(updatesArray, t = null) {
    try {
      // Recorrer el array y actualizar cada registro
      for (const update of updatesArray) {
        const { id, points } = update;

        // Buscar el registro por id
        const homePerson = await HomePerson.findByPk(id, { transaction: t });

        if (homePerson) {
          // Sumar los puntos al valor actual
          homePerson.points += points;
          homePerson.interactions += 1;

          // Guardar los cambios
          await homePerson.save({ transaction: t });
        }
      }

      logger.info("Puntos actualizados exitosamente por id.");
    } catch (error) {
      logger.error(`Error al actualizar puntos por id: ${error.message}`);
      throw error;
    }
  },

  async updatePointsById(updatesArray, t = null) {
    try {
        // Recorrer el array y actualizar cada registro
        for (const update of updatesArray) {
            const { id, pointsToSubtract = 0, pointsToAdd = 0 } = update;

            // Buscar el registro por id
            const homePerson = await HomePerson.findByPk(id, { transaction: t });

            if (homePerson) {
                // Restar los puntos a restar y sumar los puntos a agregar
                homePerson.points -= pointsToSubtract;
                homePerson.points += pointsToAdd;

                // Guardar los cambios
                await homePerson.save({ transaction: t });
            }
        }

        logger.info("Puntos actualizados exitosamente por id.");
    } catch (error) {
        logger.error(`Error al actualizar puntos por id: ${error.message}`);
        throw error;
    }
},

  async updatePointsByHomeAndPerson(updatesArray, t = null) {
    try {
      // Recorrer el array y actualizar cada registro
      for (const update of updatesArray) {
        const { home_id, person_id, points } = update;

        // Buscar el registro por home_id y person_id
        const homePerson = await HomePerson.findOne({
          where: {
            home_id,
            person_id,
          },
          transaction: t,
        });
        // Sumar los puntos al valor actual
        homePerson.points += points;
        homePerson.interactions += 1;

        // Guardar los cambios
        await homePerson.save({ transaction: t });
      }

      logger.info("Puntos actualizados exitosamente por home_id y person_id.");
    } catch (error) {
      logger.error(
        `Error al actualizar puntos por home_id y person_id: ${error.message}`
      );
      throw error;
    }
  },

  async getPeopleByHomeId(homeId) {
    try {
      const homePeople = await HomePerson.findAll({
        where: { home_id: homeId }, // Filtra por home_id
        include: [
          { model: Person, as: "person" },
          { model: Role, as: "role" },
        ],
        order: [["points", "DESC"]], // Ordenar por puntos de mayor a menor
      });

      // Mapear los resultados para obtener solo los datos necesarios
      const mappedHomePeople = homePeople.map((homePerson) => {
        // Evitar división por cero o valores nulos
        let percent = homePerson.interactions
          ? homePerson.points / homePerson.interactions
          : 0;

        // Redondear a dos decimales y validar que no sea menor a 0
        percent = percent < 0 || percent == null ? 0 : parseFloat(percent.toFixed(2));

        return {
          id: homePerson.id,
          homeId: homePerson.home_id, 
          home_id: homePerson.home_id, 
          personId: homePerson.person_id, 
          person_id: homePerson.person_id, 
          personName: homePerson.person.name, 
          personImage: homePerson.person.image,
          roleId: homePerson.role_id, 
          role_id: homePerson.role_id, 
          roleName: homePerson.role.name, 
          points: homePerson.points, 
          percent,
        };
      });

      return mappedHomePeople;
    } catch (error) {
      logger.error(`Error al obtener personas por home_id: ${error.message}`);
      throw error;
    }
  },
};

module.exports = HomePersonRepository;
