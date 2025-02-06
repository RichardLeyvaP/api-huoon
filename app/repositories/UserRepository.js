const { User, Configuration, Person, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const authConfig = require("../../config/auth");
const logger = require("../../config/logger"); // Logger para seguimiento

class UserRepository {
  async findAll() {
    return await User.findAll();
  }

  async findById(id) {
    return await User.findByPk(id);
  }

  async create(body, t) {
    try {
      let hashedPassword = bcrypt.hashSync(
        body.password,
        Number.parseInt(authConfig.rounds)
      );
      const extractedName = body.user ? body.user : body.email.split("@")[0];
      // Crear el usuario con la contraseña encriptada
      const user = await User.create(
        {
          name: extractedName,
          email: body.email,
          password: hashedPassword,
          language: body.language || "es", // Asigna 'es' si no se proporciona language
        },
        { transaction: t }
      );
      return user;
    } catch (err) {
      logger.error(`Error en UserRepository->store: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  }

  async update(user, body, t) {
    try {
      // Lista de campos que pueden ser actualizados
      const fieldsToUpdate = ["name", "email", "language"];

      // Filtrar los campos presentes en req.body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Actualizar solo si hay datos que cambiar
      if (Object.keys(updatedData).length > 0) {
        await user.update(updatedData, { transaction: t });
        logger.info(
          `Usuario actualizado exitosamente: ${user.name} (ID: ${user.id})`
        );
      }

      return user;
    } catch (err) {
      logger.error(`Error en PersonRepository->update: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  }

  async delete(user) {
    return await user.destroy();
  }

  async getUserNotificationTokens() {
    try {
      // Obtener usuarios con su configuración asociada
      const users = await User.findAll({
        include: [
          {
            model: Configuration,
            attributes: ["tokenNotification"], // Solo obtener este campo
            as:'configurations'
          },
        ],
        attributes: ["id"], // Solo necesitamos el ID del usuario
      });

      // Filtrar y mapear los datos
      const tokenArray = [];
      const userTokenArray = [];

      users.forEach((user) => {
        if (user.configuration && user.configurations[0].tokenNotification) {
          tokenArray.push(user.configurations[0].tokenNotification);
          userTokenArray.push({
            user_id: user.id,
            firebaseId: user.configurations[0].tokenNotification,
          });
        }
      });

      return { tokens: tokenArray, userTokens: userTokenArray };
    } catch (error) {
      logger.error(
        `Error en UserRepository->getUserNotificationTokens: ${error.message}`
      );
      throw error;
    }
  }

  async getUserNotificationTokensByPersons(personIds, people){
    try {
        // Obtener usuarios relacionados con las personas dadas
        const users = await User.findAll({
          include: [
            {
              model: Configuration,
              attributes: ["tokenNotification"],
              as: 'configurations'
            },
            {
              model: Person,
              attributes: ["id"], // Solo necesitamos el ID de la persona
              as: 'person',
              where: { id: personIds } // Filtrar por los IDs de personas
            }
          ],
          attributes: ["id"] // Solo necesitamos el ID del usuario
        });
    
        // Filtrar y mapear los datos
        const tokenArray = [];
        const userTokenArray = [];
    
        users.forEach((user) => {
          if (user.configurations?.length > 0 && user.configurations[0]?.tokenNotification) {
              // Buscar el rol correspondiente en el array de `people`
              const personRole = people.find(
                (person) => parseInt(person.person_id) === user.person.id
              );
      
              //if (personRole) {
                tokenArray.push(user.configurations[0].tokenNotification);
                userTokenArray.push({
                  user_id: user.id,
                  person_id: user.person.id,
                  firebaseId: user.configurations[0].tokenNotification,
                  role_id: personRole.role_id,
                  roleName: personRole.roleName, // Tomamos el nombre del rol directamente
                });
              //}
            }
          });
    
        return { tokens: tokenArray, userTokens: userTokenArray };
      } catch (error) {
        logger.error(`Error en UserRepository->getUserNotificationTokensByPersons: ${error.message}`);
        throw error;
      }
  }
}

module.exports = new UserRepository();
