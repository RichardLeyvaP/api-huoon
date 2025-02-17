const { Op } = require('sequelize');
const { Role, Home, HomePerson, Person } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

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
    
          if (!homePerson) {
            throw new Error('No se encontró el registro para el hogar y la persona especificados.');
          }
    
          // Suma los puntos al valor actual
          homePerson.points += points;
    
          // Guarda los cambios en la base de datos
          await homePerson.save();
    
          return homePerson;
        } catch (error) {
          logger.error('Error al sumar puntos:', error);
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

      async updatePointsById(updatesArray, t = null) {
        try {
          // Recorrer el array y actualizar cada registro
          for (const update of updatesArray) {
            const { id, points } = update;
    
            // Buscar el registro por id
            const homePerson = await HomePerson.findByPk(id, { transaction: t });
    
            if (!homePerson) {
              throw new Error(`No se encontró el registro con id: ${id}`);
            }
    
            // Sumar los puntos al valor actual
            homePerson.points += points;
    
            // Guardar los cambios
            await homePerson.save({ transaction: t });
          }
    
          logger.info('Puntos actualizados exitosamente por id.');
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
    
            // Guardar los cambios
            await homePerson.save({ transaction: t });
          }
    
          logger.info('Puntos actualizados exitosamente por home_id y person_id.');
        } catch (error) {
          logger.error(`Error al actualizar puntos por home_id y person_id: ${error.message}`);
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
          const mappedHomePeople = homePeople.map((homePerson) => ({
            id: homePerson.id,
            homeId: homePerson.home_id, // ID del hogar
            home_id: homePerson.home_id, // ID del hogar
            personId: homePerson.person_id, // ID de la persona
            person_id: homePerson.person_id, // ID de la persona
            personName: homePerson.person.name, // Nombre de la persona
            personImage: homePerson.person.image,
            roleId: homePerson.role_id, // ID del rol
            role_id: homePerson.role_id, // ID del rol
            roleName: homePerson.role.name, // Nombre del rol
            points: homePerson.points, // Nombre del rol
          }));
    
          return mappedHomePeople;
        } catch (error) {
          logger.error(`Error al obtener personas por home_id: ${error.message}`);
          throw error;
        }
      }

};

module.exports = HomePersonRepository;
