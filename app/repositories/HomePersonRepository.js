const { Op } = require("sequelize");
const { Role, Home, HomePerson, Person, User } = require("../models");
const logger = require("../../config/logger"); // Logger para seguimiento
const RoleRepository = require("./RoleRepository");

const HomePersonRepository = {
  async createHomePerson(body) {
    const { home_id, person_id } = body;

    try {
      // Obtener el rol "Miembro" del repositorio de roles
      const role = await RoleRepository.findHomeMemberRole();
      if (!role) {
        throw new Error('Rol "Miembro" no encontrado en la base de datos');
      }

      const homePerson = await HomePerson.create({
        home_id,
        person_id,
        role_id: role.id,
      });

      return homePerson;
    } catch (error) {
      // Puedes loguear aquí si usas un logger
      throw new Error(`Error al crear HomePerson: ${error.message}`);
    }
  },

  async createHomePersons(homeId, people, transaction = null) {
    if (!Array.isArray(people) || people.length === 0) {
      throw new Error('El array "people" es requerido y no puede estar vacío');
    }

    // Normalizar los datos: asegurar que IDs sean números
    const homePersonsData = people.map(person => ({
      home_id: Number(homeId),
      person_id: Number(person.person_id || person.id),
      role_id: Number(person.role_id || person.roleId)
    }));

    // Usar bulkCreate para eficiencia
    const created = await HomePerson.bulkCreate(homePersonsData, {
      transaction,
      validate: true, // opcional, si tienes validaciones en el modelo
      individualHooks: false // mejora rendimiento
    });

    return created;
  },
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

  async getPersonByHomeId(homeId) {
  try {
    const homePeople = await HomePerson.findAll({
      where: { home_id: homeId },
      include: [
        {
          model: Person,
          as: "person", // ← ¡Asegúrate de que esto coincida con el modelo!
          attributes: [
            'id', 'user_id', 'name', 'birth_date', 'age', 'gender',
            'email', 'phone', 'address', 'image', 'emergencyContact',
            'medical_record_number', 'document_type', 'document_number',
            'health_coverage', 'coverage_name', 'blood_type', 'updatedAt'
          ],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'language'],
            },
          ],
        },
      ],
      order: [["points", "DESC"]], // Puedes mantenerlo si quieres ordenar por puntos, pero no afecta la salida
    });

    // 👇 Aquí está la clave: Solo mapeamos la persona, NADA MÁS
    const mappedPeople = homePeople
      .filter(homePerson => homePerson.person) // Filtrar si no hay persona asociada
      .map(homePerson => this.mapPersonData(homePerson.person)); // Mapear directamente

    return mappedPeople;

  } catch (error) {
    logger.error(`Error al obtener personas por home_id: ${error.message}`);
    throw error;
  }
},

  mapPersonData(person) {
  // Asegurarse de que person.user exista (puede ser null si no se incluyó)
    const user = person.user || {};

    return {
      id: person.id,
      userId: person.user_id,
      name: person.name,
      user: user.name || '', // Evitar undefined
      language: user.language || '',
      birthDate: person.birth_date,
      age: person.age,
      gender: person.gender,
      email: person.email,
      phone: person.phone,
      address: person.address,
      image: person.image,
      emergencyContact: person.emergencyContact,
      medicalRecordNumber: person.medical_record_number,
      documentType: person.document_type,
      documentNumber: person.document_number,
      healthCoverage: person.health_coverage,
      coverageName: person.coverage_name,
      blood_type: person.blood_type,
      bloodType: person.blood_type,
      date: person.updatedAt
        ? `${person.updatedAt.getFullYear()}-${String(
            person.updatedAt.getMonth() + 1
          ).padStart(2, "0")}-${String(person.updatedAt.getDate()).padStart(2, "0")}`
        : this.getCurrentLocalDate(), // Asegúrate de que getCurrentLocalDate() esté disponible en este contexto
    };
  },

  async getCurrentLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

   async findLatestHomeByPersonId(personId) {
    return await HomePerson.findOne({
      where: { person_id: personId },
      order: [['createdAt', 'DESC']], // Tomar el más reciente
      include: [{
        model: Home,
        as: "home",
        attributes: ['id']
      }]
    });
  }
};

module.exports = HomePersonRepository;
