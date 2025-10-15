const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const {
  Home,
  HomeType,
  Status,
  HomePerson,
  Role,
  Person,
  User,
  Configuration,
  sequelize,
} = require("../models");
const crypto = require("crypto");
const logger = require("../../config/logger"); // Logger para seguimiento
const i18n = require("../../config/i18n-config");
const bcrypt = require('bcrypt');
const authConfig = require('../../config/auth'); 
const e = require("express");
const ImageService = require("../services/ImageService");
const UserRepository = require("./UserRepository");
const NotificationRepository = require("./NotificationRepository");

const HomeRepository = {
  // Obtener todas las casas
  async findAll() {
    return await Home.findAll({
      attributes: [
        "id",
        "name",
        "address",
        "geo_location",
        "timezone",
        "image",
        "residents",
        "home_type_id",
        "status_id",
        "code"
      ],
      include: [
        {
          model: HomeType,
          as: "homeType",
          attributes: ["id", "name"],
        },
        {
          model: Status,
          as: "status",
          attributes: ["id", "name", "description"],
        },
      ],
    });
  },

  async findAllHomes(personId) {
    return await Home.findAll({
      where: {
        [Op.or]: [
          { person_id: personId }, // Relación directa con la persona
          sequelize.literal(`EXISTS (
            SELECT 1
            FROM home_person
            WHERE home_person.home_id = Home.id
            AND home_person.person_id = ${personId}
          )`), // Relación indirecta a través de la tabla intermedia home_person
        ],
      },
      include: [
        {
          model: HomePerson,
          as: "homePersons",
          include: [
            {
              model: Role,
              as: "role", // Incluir los detalles del rol
              attributes: ["id", "name", "description"],
            },
          ],
          where: { person_id: personId }, // Filtrar solo las relaciones relevantes
          required: false, // Permitir hogares sin una relación en home_person
        },
        {
          model: HomeType,
          as: "homeType", // Incluir tipo de hogar
          attributes: ["id", "name"],
        },
        {
          model: Status,
          as: "status", // Incluir estado del hogar
          attributes: ["id", "name", "description"],
        },
      ],
    });
  },

  async peopleHome(home, personId) {
    const homePersons = await HomePerson.findAll({
      where: { home_id: home.id },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name", "email", "image"],
        },
      ],
      order: [["points", "DESC"]], // Ordenar por puntos de mayor a menor
    });

    // Devolver las personas mapeadas
    let people = homePersons.map((homePerson) => {
      let percent = homePerson.interactions
        ? homePerson.points / homePerson.interactions
        : 0;

      // Redondear a dos decimales y validar que no sea menor a 0
      percent = percent < 0 || percent == null ? 0 : parseFloat(percent.toFixed(2));
      return {
      id: homePerson.person_id,
      homePersonId: homePerson.id,
      name: homePerson.person.name,
      image: homePerson.person.image,
      roleId: homePerson.role_id,
      role_id: homePerson.role_id,
      points: homePerson.points,
      percent,
      roleName:
        i18n.__(`roles.${homePerson.role.name}.name`) !==
        `roles.${homePerson.role.name}.name`
          ? i18n.__(`roles.${homePerson.role.name}.name`) // Traducción del rol si está disponible
          : homePerson.role.name,
      }
    });

    // Verificar si la persona que hace la consulta tiene relación directa con la tarea
    const personAlreadyIncluded = people.some(
      (person) => person.id === personId
    );
    // Si la persona no está relacionada, se agrega solo como "Creador"
    if (!personAlreadyIncluded && home.person_id === personId) {
      const person = await Person.findByPk(personId); // Obtener los detalles de la persona
      if (person) {
        people.push({
          id: home.person_id,
          homePersonId: 0,
          name: person.name,
          image: person.image,
          roleId: 0,
          role_id: 0,
          points: 0,
          percent: 0,
          roleName:
            i18n.__(`roles.${"Creador"}.name`) !== `roles.${"Creador"}.name`
              ? i18n.__(`roles.${"Creador"}.name`) // Traducción del rol si está disponible
              : "Creador",
        });
      }
    }

    return people;
  },

  // Buscar una casa por ID
  async findById(id) {
    return await Home.findByPk(id, {
      attributes: [
        "id",
        "name",
        "address",
        "geo_location",
        "timezone",
        "image",
        "residents",
        "home_type_id",
        "status_id",
        "person_id",
        "code"
      ],
      include: [
        {
          model: HomeType,
          as: "homeType",
          attributes: ["id", "name"],
        },
        {
          model: Status,
          as: "status",
          attributes: ["id", "name", "description"],
        },
      ],
    });
  },

  async getHomePeople(homeId) {
    try {
      // Realizar la consulta a la base de datos
      const homePeople = await HomePerson.findAll({
        where: { home_id: homeId },
        include: [
          {
            model: Role,
            attributes: ["name"], // Suponiendo que el nombre del rol está en la columna 'name'
            as: "role", // Alias de la relación
          },
        ],
      });

      // Formatear la respuesta
      const formattedResponse = homePeople.map((person) => ({
        person_id: person.person_id,
        role_id: person.role_id,
        roleName: person.role ? person.role.name : null, // Obtener el nombre del rol
      }));
      // Crear un array solo con los person_id
      const personIds = homePeople.map((person) => person.person_id);

      // Devolver ambos resultados
      return {
        people: formattedResponse, // [[person_id: 5, role_id: 4, roleName: "prueba"], ...]
        personIds: personIds, // [5, 6, ...]
      };
    } catch (error) {
      logger.error("Error al obtener los registros de home_person:", error);
      throw error;
    }
  },

  async encryptData(data, secretKey) {
    const iv = "2017111319891230"; // IV fijo de 16 bytes
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(secretKey),
      iv
    );
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted; // Retorna un string
  },
  // Crear una nueva casa con manejo de imágenes
  async create(body, file, t) {
    const {
      name,
      address,
      geo_location,
      timezone,
      residents,
      home_type_id,
      status_id,
      person_id,
      code,
      status
    } = body;
    let hashedCode = null;
    if (code) {
        hashedCode = Math.floor(100000 + Math.random() * 900000).toString();
    }
    const home = await Home.create(
      {
        name,
        address,
        geo_location,
        timezone,
        residents,
        home_type_id,
        status_id,
        person_id,
        code: hashedCode,
        image: "homes/default.jpg", // Imagen predeterminada
        status,
        reset_code: Date.now() + 3 * 60 * 1000 // 3 min
      },
      { transaction: t }
    );

    // Manejar archivo si se proporciona
    if (file) {
      const newFilename = ImageService.generateFilename(
        "homes",
        home.id,
        file.originalname
      );
      home.image = await ImageService.moveFile(file, newFilename);
      await home.update({ image: home.image }, { transaction: t });
    }
    return home;
  },

  // Actualizar una casa con manejo de imágenes
  async update(home, body, file, t) {
    const fieldsToUpdate = [
      "name",
      "address",
      "geo_location",
      "timezone",
      "residents",
      "home_type_id",
      "status_id",
      "image",
      "person_id",
    ];

    const updatedData = Object.keys(body)
      .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});
        // Manejo seguro del código
  /*if (Object.prototype.hasOwnProperty.call(body, 'code')) {
    updatedData.code = (body.code && typeof body.code === 'string' && body.code.trim() !== '')
      ? bcrypt.hashSync(body.code.trim(), Number.parseInt(authConfig.rounds))
      : null;
  }*/

    try {
      // Manejar el archivo si se proporciona
      if (file) {
        if (home.image && home.image !== "homes/default.jpg") {
          await ImageService.deleteFile(home.image);
        }
        const newFilename = ImageService.generateFilename(
          "homes",
          home.id,
          file.originalname
        );
        updatedData.image = await ImageService.moveFile(file, newFilename);
      }

      // Actualizar los datos en la base de datos si hay cambios
      if (Object.keys(updatedData).length > 0) {
        await home.update(updatedData, { transaction: t }); // Usar la transacción
        logger.info(`Casa actualizada exitosamente (ID: ${home.id})`);
      }

      return home;
    } catch (err) {
      logger.error(`Error en HomeRepository->update: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },
  
  async verifyHomeCode(codeToVerify) {
    try {
      // 1. Generar el hash del código a verificar (con los mismos rounds)
      /*const baseKey = "bulletin"; // Usa el string que desees

        // Generar la clave de 32 bytes con SHA-256
        const secretKey = crypto.createHash("sha256").update(baseKey).digest();
        let hashedCode = await this.encryptData(codeToVerify, secretKey);*/
      //logger.info(hashedCode);
      // 2. Búsqueda directa en la DB (solo 1 query)
      const home = await Home.findOne({
        where: {
          code: codeToVerify, // Busca el hash completo directamente
          reset_code: {
            [Op.gt]: Date.now() // Solo registros donde reset_expire > ahora
          }
        }
      });

      if (home) {
        // Guardar en caché para futuras búsquedas
        return { found: true, home: home };
      }

      return { found: false, home: null };

    } catch (error) {
      logger.error(`Error en verifyHomeCode: ${error.message}`);
      return { found: false, home: null };
    }
  },

  async syncHomePeople(homeId, peopleArray, t, home = null) {
    // Obtener las asociaciones actuales para la tarea especificada
    const currentAssociations = await HomePerson.findAll({
      where: { home_id: homeId },
    });

    const currentMap = currentAssociations.reduce((map, assoc) => {
      map[`${assoc.person_id}-${assoc.home_id}`] = assoc; // Guardamos el objeto completo en el mapa
      return map;
    }, {});

    // Crear un mapa del nuevo conjunto de datos (key: person_id-home_id)
    const newMap = peopleArray.reduce((map, person) => {
      map[`${person.person_id}-${homeId}`] = person;
      return map;
    }, {});

    const toAdd = [];
    const toUpdate = [];
    const toDelete = [];
    const actions = []; // Array para registrar las acciones realizadas
    const notifications = [];

    // Obtener tokens de los usuarios involucrados
    const personIds = peopleArray.map((p) => p.person_id);
    const { tokens, userTokens } =
      await UserRepository.getUserNotificationTokensByPersons(
        personIds,
        peopleArray
      );

    // Recorremos las nuevas asociaciones para determinar si agregar o actualizar
    Object.keys(newMap).forEach((key) => {
      const incoming = newMap[key];

      // Verificar si ya existe una relación para esta combinación
      const current = currentMap[key];
      if (!current) {
        // Si la asociación no existe en la base de datos, agregarla
        toAdd.push({
          home_id: homeId,
          ...incoming,
        });
        // Notificación de agregado
        const userAdd = userTokens.find(
          (u) => u.person_id === parseInt(incoming.person_id)
        );

        if (userAdd) {
          notifications.push({
            token: [userAdd.firebaseId],
            notification: {
              title: `Fuiste agregado al hogar ${home}`,
              body: `Tu rol: ${userAdd.roleName}`,
            },
            data: {
              route: "/getHome",
              home_id: String(homeId),
              role_id: String(userAdd.role_id),
              roleName: String(userAdd.roleName),
            },
          });
        }
      } else {
        // Si la asociación existe pero el rol ha cambiado, la actualizamos
        if (current.role_id !== incoming.role_id) {
          toUpdate.push({
            id: current.id, // Usamos el id de la relación actual
            role_id: incoming.role_id,
          });
          // Notificación de actualizado
          const user = userTokens.find(
            (u) => u.person_id === parseInt(incoming.person_id)
          );

          if (user) {
            notifications.push({
              token: [user.firebaseId],
              notification: {
                title: `Tu rol en el hogar ${home} fue actualizado`,
                body: `Nuevo rol: ${user.roleName}`,
              },
              data: {
                route: "/getHome",
                home_id: String(homeId),
                role_id: String(user.role_id),
                roleName: String(user.roleName),
              },
            });
          }
        }
      }
    });

    // Recorremos las asociaciones actuales para eliminar las que ya no existen en el nuevo conjunto
    await Promise.all(currentAssociations.map(async (current) => {
      const key = `${current.person_id}-${current.home_id}`;
      if (!newMap[key]) {
        toDelete.push(current.id);
        // Notificación de eliminación
        const user = userTokens.find(
          (u) => u.person_id === parseInt(current.person_id)
        );
        if (user) {
          notifications.push({
            token: [user.firebaseId],
            notification: {
              title: `Fuiste eliminado del hogar ${home}`,
              body: `Ya no perteneces a este hogar.`,
            },
            data: {
              route: "/getHome",
              home_id: String(homeId),
              role_id: String(user.role_id),
              roleName: String(user.roleName),
            },
          });
        }
        //eliminar de la onfiguración el home si esta como preferido
         // Actualizar configuración directamente aquí
    try {
      const person = await Person.findOne({
        where: { id: current.person_id },
        include: [{
          model: User,
          as: 'user'
        }],
        transaction: t,
      });

      if (!person || !person.user) return;

      const userId = person.user.id;

      const configsToUpdate = await Configuration.findAll({
        where: {
          user_id: userId,
          home: current.home_id,
        },
        transaction: t,
      });

      if (configsToUpdate.length > 0) {
        for (const config of configsToUpdate) {
          await config.update({ home: null }, { transaction: t });
        }
      }
    } catch (error) {
      logger.error(`Error al actualizar configuración para persona ${current.person_id}:`, error);
    }

      }
}));

    // Aplicar las operaciones: eliminar, actualizar, agregar
    if (toDelete.length > 0) {
      await HomePerson.destroy({
        where: { id: toDelete },
        transaction: t,
      });
      actions.push({ action: "deleted", ids: toDelete });
    }

    if (toUpdate.length > 0) {
      for (const update of toUpdate) {
        await HomePerson.update(
          { role_id: update.role_id },
          { where: { id: update.id }, transaction: t }
        );
      }
      actions.push({ action: "updated", ids: toUpdate.map((u) => u.id) });
    }

    if (toAdd.length > 0) {
      await HomePerson.bulkCreate(toAdd, { transaction: t });
      actions.push({ action: "added", ids: toAdd.map((a) => a.id) });
    }

    if (notifications.length) {
      const notificationsToCreate = userTokens
        .map((user) => {
          const notification = notifications.find(
            (n) => n.token[0] === user.firebaseId
          );
          if (notification) {
            return {
              home_id: homeId,
              user_id: user.user_id,
              title: notification.notification.title,
              description: notification.notification.body,
              data: notification.data, // Usamos el valor procesado
              route: "/getHome",
              firebaseId: notification.token[0],
            };
          }
          return null; // Retornar null si no se encuentra la notificación
        })
        .filter((notification) => notification !== null); // Filtrar los elementos null

      const results = await Promise.allSettled(
        notificationsToCreate.map(async (notification) => {
          try {
            const result = await NotificationRepository.create(notification, t);
          } catch (error) {
            logger.error(
              `Error al crear notificación para user_id ${notification.user_id}:`,
              error
            );
          }
        })
      );

      const firebaseResults =
        await NotificationRepository.sendNotificationMultiCast(notifications);
    }

    // Devolver detalles de las operaciones realizadas
    return { toAdd, toUpdate, toDelete, actions };
  },

  // Eliminar una casa
  async delete(home) {
    if (home.image && home.image !== "homes/default.jpg") {
      await ImageService.deleteFile(home.image);
    }

    return await home.destroy();
  },

  async findByIds(ids) {
    try {
      const homes = await Home.findAll({
        where: {
          id: ids,
        },
      });
      return homes;
    } catch (error) {
      logger.error(`Error al buscar hogares por IDs: ${error.message}`);
      throw error;
    }
  },
  async generateAndSaveCode(home_id, t = null) {
    logger.info(`🔍 Iniciando generateAndSaveCode para home_id: ${home_id}`);
    // 1. Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Ej: "123456"

    // 2. Hashear el código (nunca guardes en texto plano)
    //const hashedCode = bcrypt.hashSync(code, parseInt(authConfig.rounds));

    // 3. Actualizar el hogar con el código y expiración (3 minutos)
    const [updatedRows] = await Home.update(
    {
      code: code,
      reset_code: Date.now() + 3 * 60 * 1000
    },
    {
      where: { id: home_id },
      transaction: t || undefined // 👈 dentro del mismo objeto
    }
  );

    // 4. Verificar que se actualizó
    if (updatedRows === 0) {
      throw new Error('Hogar no encontrado');
    }

    // 5. Devolver el código en texto plano (solo para uso inmediato)
    return code;
  }
};

module.exports = HomeRepository;
