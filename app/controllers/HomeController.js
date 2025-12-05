const { Person, Role, HomePerson, Configuration, User, sequelize } = require("../models"); // Importar el modelo Home
const logger = require("../../config/logger"); // Importa el logger
const i18n = require("../../config/i18n-config");
const { StatusService, RoleService } = require("../services");
const {
  HomeRepository,
  HomeTypeRepository,
  StatusRepository,
  WareHouseRepository,
  UserRepository,
  NotificationRepository,
  RoleRepository,
  HomePersonRepository,
  HouseholdRequestRepository,
} = require("../repositories");
const { sendEmail } = require("../services/EmailService");

const HomeController = {
  // Obtener todas las casas
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar las casas`);

    try {
      const homes = await HomeRepository.findAll();

      if (!homes.length) {
        return res.status(204).json({ msg: "HomesNotFound" });
      }

      // Mapear la respuesta
      const mappedHomes = homes.map((home) => {
        const homeType = home.homeType; // Obtener el tipo de casa relacionado
        return {
          id: home.id,
          statusId: home.status_id,
          name: home.name,
          address: home.address,
          homeTypeId: home.home_type_id,
          nameHomeType: homeType ? homeType.name : null, // Manejo de caso cuando no hay tipo de casa
          residents: home.residents,
          geoLocation: home.geo_location,
          timezone: home.timezone,
          nameStatus: home.status.name, // Aquí asumo que tienes una propiedad status directa en el modelo
          image: home.image,
          code: home.code
        };
      });

      res.status(200).json({ homes: mappedHomes });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getHomes(req, res) {
    logger.info(`${req.user.name} - Entra a buscar las hogares`); // Registro de la acción

    try {
      const personId = req.person.id;
      // Obtener solo las tareas principales (sin padre) directamente en la consulta
      const homes = await HomeRepository.findAllHomes(personId);

      if (!homes.length) {
        return res.status(204).json({ msg: "HomeNotFound", homes: homes });
      }
      // Mapear las tareas
      const mappedHomes = await Promise.all(
        homes.map(async (home) => {
          const personRole =
            home.homePersons.find((hp) => hp.person_id === personId)?.role
              ?.name || "Creador";
          // Calcular el porcentaje
          const homePerson = home.homePersons.find(
            (hp) => hp.home_id === home.id
          );
          let percent = 0;
          if (homePerson && homePerson.interactions > 0) {
            percent = homePerson.points / homePerson.interactions; // Calcular porcentaje
            percent = parseFloat(percent.toFixed(2)); // Redondear a dos decimales
          }

          return {
            id: home.id,
            statusId: home.status_id,
            status_id: home.status_id,
            name: home.name,
            nameRole:
              i18n.__(`roles.${personRole}.name`) !== `roles.${personRole}.name`
                ? i18n.__(`roles.${personRole}.name`)
                : personRole, // Agregar el rol de la persona en el hogar
            address: home.address,
            homeTypeId: home.home_type_id,
            home_type_id: home.home_type_id,
            nameHomeType: home.homeType.name, // Manejo de caso cuando no hay tipo de casa
            residents: home.residents,
            geoLocation: home.geo_location,
            geo_location: home.geo_location,
            timezone: home.timezone,
            nameStatus: home.status.name, // Aquí asumo que tienes una propiedad status directa en el modelo
            image: home.image,
            percent: percent,
            code: home.code,
            // Personas relacionadas con la tarea
            people: await HomeRepository.peopleHome(home, personId),
          };
        })
      );

      return res.status(200).json({ homes: mappedHomes }); // Tareas encontradas
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->getHomes: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear una nueva casa
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva casa`);
    logger.info("datos recibidos al crear un hogar");
    logger.info(JSON.stringify(req.body));

    const {
      name,
      address,
      home_type_id,
      residents,
      geo_location,
      timezone,
      status_id,
      image,
      people,
      code,
    } = req.body;
    let tokensData = [];
    let userTokensData = [];
    const personId = req.person.id;
    req.body.person_id = personId;
    // Verificar si el tipo de hogar existe
    const homeType = await HomeTypeRepository.findById(home_type_id);
    if (!homeType) {
      logger.error(
        `HomeController->store: Typo de Hogar no encontrado con ID ${home_type_id}`
      );
      return res.status(404).json({ msg: "TypeHomeNotFound" });
    }
    // Verificar si el estado exista
    const status = await StatusRepository.findById(status_id);
    if (!status) {
      logger.error(
        `HomeController->store: Estado no encontrado con ID ${status_id}`
      );
      return res.status(404).json({ msg: "StatusNotFound" });
    }

    let filteredPeople = [];
    if (req.body.people && req.body.people.length > 0) {
      // Filtrar las personas con role_id != 0
      filteredPeople = req.body.people.filter(
        (person) => parseInt(person.role_id) !== 0
      );

      // Si no quedan personas después del filtrado, devolver un error
      if (filteredPeople.length === 0) {
        return res
          .status(400)
          .json({ msg: "No se han proporcionado personas válidas." });
      }

      const personIds = filteredPeople.map((person) =>
        parseInt(person.person_id)
      );
      const roleIds = filteredPeople.map((person) => parseInt(person.role_id));

      // Verificar personas, roles y hogares
      const [persons, roles] = await Promise.all([
        Person.findAll({ where: { id: personIds } }),
        Role.findAll({ where: { id: roleIds } }),
      ]);
      // Comprobar si alguna entidad no existe
      const missingPersons = personIds.filter(
        (id) => !persons.find((p) => p.id === id)
      );
      const missingRoles = roleIds.filter(
        (id) => !roles.find((r) => r.id === id)
      );

      if (missingPersons.length || missingRoles.length) {
        logger.error(`No se encontraron personas o roles con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}`);
        return res
          .status(400)
          .json({ msg: "Datos no encontrados para algunas asociaciones." });
      }

      const { tokens, userTokens } =
        await UserRepository.getUserNotificationTokensByPersons(
          personIds,
          filteredPeople
        );
      tokensData = tokens;
      userTokensData = userTokens;
    }
    
    let notifications = {};
    const t = await sequelize.transaction();
    try {
      const home = await HomeRepository.create(req.body, req.file, t);
      if (filteredPeople.length > 0) {
        // Crear las asociaciones en paralelo
        for (const person of filteredPeople) {
          const { person_id, role_id } = person;

          const homePerson = await HomePerson.create(
            {
              home_id: home.id,
              person_id,
              role_id,
            },
            { transaction: t }
          );
        }
        //logica de notificaciones
        if (tokensData.length) {
          // Iterar sobre cada usuario y enviar notificación personalizada
          notifications = userTokensData.map((user) => ({
            token: [user.firebaseId],
            notification: {
              title: `Fuiste asociado al hogar ${home.name}`,
              body: `Tu Rol ${user.roleName}`,
            },
            data: {
              route: "/getHome",
              home_id: String(home.id), // Convertir a string
              nameHome: String(home.name),
              role_id: String(user.role_id), // Convertir a string
              roleName: String(user.roleName),
            },
          }));

          const notificationsToCreate = userTokensData
            .map((user) => {
              const notification = notifications.find(
                (n) => n.token[0] === user.firebaseId
              );
              if (notification) {
                return {
                  home_id: home.id,
                  user_id: user.user_id,
                  title: `Fuiste asociado al hogar ${home.name}`,
                  description: `Tu rol ${user.roleName}`,
                  data: notification.data, // Usamos el valor procesado
                  route: "/getHome",
                  firebaseId: user.firebaseId,
                };
              }
              return null; // Retornar null si no se encuentra la notificación
            })
            .filter((notification) => notification !== null); // Filtrar los elementos null

          const results = await Promise.allSettled(
            notificationsToCreate.map(async (notification) => {
              try {
                const result = await NotificationRepository.create(
                  notification,
                  t
                );
              } catch (error) {
                logger.error(
                  `Error al crear notificación para user_id ${notification.user_id}:`,
                  error
                );
              }
            })
          );
        }
      }
      const user = req.user; // Supone que tienes el ID del usuario en `req.user`.
        // Intentar encontrar la configuración del usuario
        let userConfig = await Configuration.findOne({ where: { user_id: user.id } });

        // Si no existe, crear una nueva configuración para el usuario usando los valores por defecto
        if (!userConfig) {
            userConfig = await Configuration.create({ user_id: user.id, language: user.language, home: home.id });
        }
        // Si existe pero home es null, actualizarlo
      else if (userConfig.home === null || userConfig.home === undefined) {
        await userConfig.update({
          home: home.id
        });
      }
      await t.commit();
      if (notifications.length) {
        // Enviar todas las notificaciones en paralelo
        const firebaseResults =
          await NotificationRepository.sendNotificationMultiCast(notifications);
      }
      res.status(201).json({ home });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async show(req, res) {
    logger.info(`${req.user.name} - Entra a buscar un home`);
    const id = req.body.id; // Asegúrate de convertir a número

    try {
      const home = await HomeRepository.findById(req.body.id);

      if (!home) {
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      const mappedHome = {
        id: home.id,
        statusId: home.status_id,
        name: home.name,
        address: home.address,
        homeTypeId: home.home_type_id,
        nameHomeType: home.homeType ? home.homeType.name : null,
        residents: home.residents,
        geoLocation: home.geo_location,
        timezone: home.timezone,
        nameStatus: home.status.name,
        image: home.image,
        code: home.code
      };

      res.status(200).json({ homes: mappedHome });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },      

  async verifyCode(req, res) {
    logger.info(`${req.user.name} - Verificando código de hogar`);
    logger.info("Código recibido");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction(); // Opcional: si usas transacciones

    try {
      const { code } = req.body;

      if (!code) {
        await transaction.rollback(); // si usas transacción
        return res.status(400).json({
          error: "missing_code",
          message: "El código es requerido"
        });
      }

      //const { found, home } = await HomeRepository.verifyHomeCode(code);
      const { found, data } = await HouseholdRequestRepository.verifyCode(code);
      if (!found) {
        await transaction.rollback();
        return res.status(404).json({
          error: "invalid_code",
          message: "Código no válido o hogar no encontrado"
        });
      }

      const user = req.user;
      const person_id = req.person.id; // Asumiendo que req.user.id es el person_id
      const home_id = data.id;
      // 1. Actualizar onboarding_status del usuario
    // await UserRepository.update({ id: person_id }, { onboarding_status: 1 });

      // 2. Crear o actualizar configuración del usuario
      let userConfig = await Configuration.findOne({ where: { user_id: user.id } });
      if (!userConfig) {
        userConfig = await Configuration.create({
          user_id: user.id,
          language: user.language,
          home: home_id
        }, { transaction });
      } else if (userConfig.home == null) {
        await userConfig.update({ home: home_id }, { transaction });
      }

      // 3. ✅ Crear la relación HomePerson usando el nuevo método
      await HomePersonRepository.createHomePerson({
        home_id,
        person_id
      });

      const userOnboarding = await UserRepository.findById(user.id);
        await UserRepository.update(userOnboarding, { onboarding_status: 2 });

      // Confirmar transacción si la usas
      await transaction.commit();

      return res.status(200).json({
        success: true,
        home: {
          id: data.id,
          name: data.name
        }
      });

    } catch (error) {
      // Revertir transacción si algo falla
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      logger.error(`verifyCode error: ${error.message}`);
      return res.status(500).json({
        error: "server_error",
        message: "Error al verificar el código"
      });
    }
  },

  async inviteCreateHome(req, res) {
    logger.info(`Enviando solicitud de creación de hogar por menor`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { homeName, minorName, guardianEmail, minorEmail } = req.body;

    // ✅ Buscar si el guardián ya está registrado
    const userTutor = await UserRepository.findByEmail(guardianEmail);
    const register = !userTutor; // true = debe registrarse, false = ya está registrado

    // Validaciones
    if (!homeName || !minorName || !guardianEmail) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos."
      });
    }

    if (!/^.+@.+\..+$/.test(guardianEmail)) {
      return res.status(400).json({
        success: false,
        message: "Formato de correo inválido."
      });
    }
      const user = req.user;
      let t = await sequelize.transaction();
    try {
      const request = await HouseholdRequestRepository.create({
        userId: user.id,
        targetUserId: userTutor.id,
        userEmail: user.email,
        targetUserEmail: userTutor.email,
        type: 'Create',
        module: 'House',
      }, t);
      const dataApprove = encodeURIComponent(JSON.stringify({
        minorEmail,
        action: 'approve',
        register,        // ✅ Ahora tiene el valor correcto
        homeName,
        minorName,
        user_id: user.id,
        request_id: request.id
      }));

      const dataReject = encodeURIComponent(JSON.stringify({
        minorEmail,
        action: 'reject',
        register,        // ✅ Igual aquí
        homeName,
        minorName,
        user_id: user.id,
        request_id: request.id
      }));

      const emailText = `👋 Hola, tu hijo(a) ${minorName} desea crear un hogar en Huoon.\nPara aprobar, haz clic en [Aprobar hogar] o [Rechazar].`;

      const emailHtml = `
        <p>👋 Hola,</p>
        <p>Tu hijo(a) <strong>${minorName}</strong> desea crear un hogar en <strong>Huoon</strong>.</p>
        <p>
          Para aprobar, haz clic en 
          <a href="http://localhost:3000/?approval=${dataApprove}">
            <strong>[Aprobar hogar]</strong>
          </a> 
          o 
          <a href="http://localhost:3000/?approval=${dataReject}">
            <strong>[Rechazar]</strong>
          </a>.
        </p>
      `;

      await sendEmail({
        to: guardianEmail,
        subject: "Solicitud de creación de hogar - Huoon",
        text: emailText,
        html: emailHtml
      });

      const userOnboarding = await UserRepository.findById(user.id, t);
       if (!userOnboarding) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado."
        });
      }
      await UserRepository.update(userOnboarding, { onboarding_status: 1 }, t);
      await t.commit();
      return res.status(200).json({
        success: true,
        message: "Invitación enviada con éxito."
      });

    } catch (error) {
       if (t) {
      await t.rollback();
    }
      logger.error("Error al enviar invitación:", error);
      return res.status(500).json({
        success: false,
        message: "No se pudo enviar la invitación. Por favor, inténtalo más tarde."
      });
    }
  },

  async sendCodeHome(req, res) {
    logger.info(`Enviando códido para unir a hogar`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { homeName, minorName, guardianEmail, minorEmail, home_id, user_id, request_id } = req.body;
    let request;
    const userId = req.user.id;
    let t = await sequelize.transaction();
    try {
      
      if (request_id){
      request = await HouseholdRequestRepository.findById(request_id, { transaction: t });
      if (!request) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: "La solicitud indicada no existe."
        });
      }
    }else {
      // ✅ Caso 2: crear nueva solicitud (invitación proactiva)
      request = await HouseholdRequestRepository.create({
        userId: userId,
        targetUserId: userId,
        requesterName: minorName,
        requesterEmail: minorEmail,
        moduleId: home_id, // o el campo que uses para el hogar
        status: 'Create',
        type: 'Home',
        // Puedes agregar más campos si los usas (ej. createdBy, etc.)
      }, { transaction: t });
    }
      const code = await HouseholdRequestRepository.generateAndSetCode(request_id, home_id, t);
      //const code = await HomeRepository.generateAndSaveCode(home_id);
      const emailHtml = `
          <p>👋 ¡Hola! ${ minorName }</p>
          <p>Has recibido el siguiente código de <strong>${req.person.name}</strong> para unirte al hogar:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #006064; background: #f0f9f9; padding: 12px 24px; border-radius: 8px; display: inline-block;">
              ${code}
            </div>
          </div>

          <p><strong>Hogar:</strong> ${homeName}</p>
          <p>🏠 <em>Únete a tu familia en Huoon</em></p>

          <p style="margin-top: 24px; font-size: 13px; color: #666;">
            ⏱️ Este código es válido por <strong>48 hrs</strong>.<br>
            Si no esperabas este mensaje, puedes ignorarlo.
          </p>
        `;

      await sendEmail({
        to: minorEmail,
        subject: "🏡 Código para unirte a tu hogar en Huoon",
        text: `Has recibido el código ${code} de ${req.person.name} para unirte al hogar "${homeName}" en Huoon.\n\nIngresa este código en la app. Es válido por 3 minutos.`,
        html: emailHtml
      });
      await t.commit();
      return res.status(200).json({
        success: true,
        message: "Código enviado con éxito."
      });

    } catch (error) {
       if (t) {
      await t.rollback();
    }
      logger.error("Error al enviar codigo:", error);
      return res.status(500).json({
        success: false,
        message: "No se pudo enviar el código. Por favor, inténtalo más tarde."
      });
    }
  },

  async approveHome(req, res) {
    logger.info(`${req.user.name} creando un hogar y generando códido para unir al hogar`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

    let approvalData = req.body.approvalData;
    if (typeof approvalData === 'string') {
      try {
        approvalData = JSON.parse(approvalData);
      } catch (e) {
        logger.error("Error al parsear approvalData:", e.message);
        return res.status(400).json({ success: false, message: "approvalData inválido" });
      }
    }
    const {  
      name,
      address,
      home_type_id,
      residents,
      geo_location,
      timezone,
      status_id,
      image,
      people,
      code} = req.body;
      const personId = req.person.id;
      req.body.person_id = personId;
       const homeType = await HomeTypeRepository.findById(home_type_id);
      if (!homeType) {
        logger.error(
          `HomeController->approveHome: Typo de Hogar no encontrado con ID ${home_type_id}`
        );
        return res.status(404).json({ msg: "TypeHomeNotFound" });
      }
      // Verificar si el estado exista
      const status = await StatusRepository.findById(status_id);
      if (!status) {
        logger.error(
          `HomeController->approveHome: Estado no encontrado con ID ${status_id}`
        );
        return res.status(404).json({ msg: "StatusNotFound" });
      }
    let t = await sequelize.transaction();
    try {
      const home = await HomeRepository.create(req.body, req.file, t);
      await HomePersonRepository.createHomePersons(home.id, people, t);
      const code = await HouseholdRequestRepository.generateAndSetCode(approvalData.request_id, home.id, t);
      //const code = await HomeRepository.generateAndSaveCode(home.id, t);
      const emailHtml = `
      <p>👋 ¡Hola, ${approvalData.minorName}!</p>
      <p>Tu hogar en Huoon ha sido creado y estás a un paso de unirte.</p>
      <p>Recibiste el siguiente código de <strong>${req.person.name}</strong> para unirte al hogar:</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #006064; background: #f0f9f9; padding: 12px 24px; border-radius: 8px; display: inline-block;">
          ${code}
        </div>
      </div>

      <p><strong>Hogar:</strong> ${name}</p>
      <p>🏠 <em>Únete a tu familia en Huoon</em></p>

      <p style="margin-top: 24px; font-size: 13px; color: #666;">
        ⏱️ Este código es válido por <strong>48 hrs</strong>.<br>
        Si no esperabas este mensaje, puedes ignorarlo.
      </p>
    `;

    await sendEmail({
      to: approvalData.minorEmail,
      subject: "🏡 Código para unirte a tu hogar en Huoon",
      text: `Tu hogar en Huoon ha sido creado. Recibiste el código ${code} de ${req.person.name} para unirte al hogar "${name}".\n\nIngresa este código en la app. Es válido por 3 minutos.`,
      html: emailHtml
    });
      await t.commit();
      return res.status(200).json({
        success: true,
        message: "Código enviado con éxito."
      });

    } catch (error) {
       if (t) {
      await t.rollback();
    }
      logger.error("Error al enviar codigo:", error);
      return res.status(500).json({
        success: false,
        message: "No se pudo enviar el código. Por favor, inténtalo más tarde."
      });
    }
  },
  // Actualizar una casa
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza el home con ID ${req.body.id}`);
    logger.info("datos recibidos al editar un hogar");
    logger.info(JSON.stringify(req.body));
    const personId = req.person.id;

    const home = await HomeRepository.findById(req.body.id);

    if (!home) {
      logger.error(
        `HomeController->update: Hogar no encontrado con ID ${req.body.id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }

    if (req.body.status_id) {
      // Verificar si el estado exista
      const status = await StatusRepository.findById(req.body.status_id);
      if (!status) {
        logger.error(
          `HomeController->update: Estado no encontrado con ID ${req.body.status_id}`
        );
        return res.status(404).json({ msg: "StatusNotFound" });
      }
    }

    if (req.body.home_type_id) {
      // Verificar si el estado exista
      const homeType = await HomeTypeRepository.findById(req.body.home_type_id);
      if (!homeType) {
        logger.error(
          `HomeController->update: Tipo de hogar no encontrado con ID ${req.body.home_type_id}`
        );
        return res.status(404).json({ msg: "HomeTypeNotFound" });
      }
    }

    let filteredPeople = [];
    if (req.body.people && req.body.people.length > 0) {
      // Filtrar las personas con role_id != 0
      filteredPeople = req.body.people.filter(
        (person) => parseInt(person.role_id) !== 0
      );

      // Si no quedan personas después del filtrado, devolver un error
      /*if (filteredPeople.length === 0) {
        return res
          .status(400)
          .json({ msg: "No se han proporcionado personas válidas." });
      }*/
      const personIds = filteredPeople.map((person) =>
        parseInt(person.person_id)
      );
      const roleIds = filteredPeople.map((person) => parseInt(person.role_id));

      // Verificar personas, roles y hogares
      const [persons, roles] = await Promise.all([
        Person.findAll({ where: { id: personIds } }),
        Role.findAll({ where: { id: roleIds } }),
      ]);
      // Comprobar si alguna entidad no existe
      const missingPersons = personIds.filter(
        (id) => !persons.find((p) => p.id === id)
      );
      const missingRoles = roleIds.filter(
        (id) => !roles.find((r) => r.id === id)
      );

      if (missingPersons.length || missingRoles.length) {
        logger.error(`No se encontraron personas o roles con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}`);
        return res
          .status(400)
          .json({ msg: "Datos no encontrados para algunas asociaciones." });
      }
    }
    const t = await sequelize.transaction();
    try {
      const homeUpdate = await HomeRepository.update(
        home,
        req.body,
        req.file,
        t
      );

      let associationsData = [];
      // Sincronizar asociaciones
      //if (filteredPeople.length > 0) {
      const { toAdd, toUpdate, toDelete } = await HomeRepository.syncHomePeople(
        req.body.id,
        filteredPeople,
        t,
        home.name
      );
      associationsData =
        toAdd.length || toUpdate.length || toDelete.length
          ? { added: toAdd, updated: toUpdate, deleted: toDelete }
          : null;
      //}

      await t.commit();
      res.status(200).json({ home: homeUpdate });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar una casa
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina home con ID ${req.body.id}`);

    try {
      const home = await HomeRepository.findById(req.body.id);

      if (!home) {
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      const { people, personIds } = await HomeRepository.getHomePeople(
        req.body.id
      );

      // 3. Actualizar `preferred_home` para cada persona
    for (const person of people) {
      const { person_id } = person;

      // Actualizar configuración directamente aquí
        const [updatedCount] = await Configuration.update(
        { home: null },
        {
          include: [
            {
              model: User,
              as: 'user',
              include: [
                {
                  model: Person,
                  as: 'person',
                  where: { id: person_id },
                  required: true,
                }
              ],
              required: true,
            }
          ],
          where: {
            home: req.body.id,
          }
        }
      );
    }

      const { tokens, userTokens } =
        await UserRepository.getUserNotificationTokensByPersons(
          personIds,
          people
        );
      let notifications = [];
      if (tokens.length) {
        // Iterar sobre cada usuario y enviar notificación personalizada
        notifications = userTokens.map((user) => ({
          token: [user.firebaseId],
          notification: {
            title: `El hogar ${home.name} fue eliminado`,
            body: `Tu Rol ${user.roleName}`,
          },
          data: {
            route: "/getHome",
            home_id: String(home.id), // Convertir a string
            nameHome: String(home.name),
            role_id: String(user.role_id), // Convertir a string
            roleName: String(user.roleName),
          },
        }));

        const notificationsToCreate = userTokens
          .map((user) => {
            const notification = notifications.find(
              (n) => n.token[0] === user.firebaseId
            );
            if (notification) {
              return {
                home_id: home.id,
                user_id: user.user_id,
                title: `El hogar ${home.name} fue eliminado`,
                description: `Tu rol ${user.roleName}`,
                data: notification.data, // Usamos el valor procesado
                route: "/getHome",
                firebaseId: user.firebaseId,
              };
            }
            return null; // Retornar null si no se encuentra la notificación
          })
          .filter((notification) => notification !== null); // Filtrar los elementos null

        const results = await Promise.allSettled(
          notificationsToCreate.map(async (notification) => {
            try {
              const result = await NotificationRepository.create(notification);
            } catch (error) {
              logger.error(
                `Error al crear notificación para user_id ${notification.user_id}:`,
                error
              );
            }
          })
        );
      }

      if (notifications.length) {
        // Enviar todas las notificaciones en paralelo
        const firebaseResults =
          await NotificationRepository.sendNotificationMultiCast(notifications);
      }
      const homeDelete = await HomeRepository.delete(home);

      res.status(200).json({ msg: "HomeDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  //Ruta unificada de Mantenedores
  async homeType_status_people(req, res) {
    logger.info(`${req.user.name} - Entra a la ruta unificada de Homes`);

    try {
      const statuses = await StatusService.getStatus("Home");
      const roles = await RoleService.getRoles("Home");
      const hometypes = await HomeController.getHomeTypes();
      const people = await HomeController.getPeople();
      const warehouses = await HomeController.getWarehouses();

      res.json({
        homestatus: statuses,
        homeroles: roles,
        hometypes: hometypes,
        homepeople: people,
        homewarehouses: warehouses,
      });
    } catch (error) {
      logger.error("Error al obtener los mantenedores:", error);
      res.status(500).json({ error: "Error al obtener los mantenedores" });
    }
  },

  async getWarehouses() {
    logger.info("Entra a Buscar Los alamcenes en (homeType_status_people)");
    try {
      const warehouses = await WareHouseRepository.findByStatus(1);

      return warehouses.map((warehouse) => {
        return {
          id: warehouse.id,
          nameWarehouses:
            i18n.__(`warehouse.${warehouse.title}.title`) ===
            `warehouse.${warehouse.title}.title`
              ? i18n.__(`warehouse.${warehouse.title}.title`)
              : warehouse.title,
          descriptionWarehouses:
            i18n.__(`warehouse.${warehouse.title}.title`) ===
            `warehouse.${warehouse.title}.title`
              ? i18n.__(`warehouse.${warehouse.title}.description`)
              : warehouse.description,
          locationWarehouses:
            i18n.__(`warehouse.${warehouse.title}.title`) ===
            `warehouse.${warehouse.title}.title`
              ? i18n.__(`warehouse.${warehouse.title}.location`)
              : warehouse.location,
        };
      });
    } catch (error) {
      logger.error("Error en getWarehouses:", error);
      throw new Error("Error al obtener los almacenes");
    }
  },

  async getHomeTypes() {
    logger.info(
      "Entra a Buscar Los tipos de hogar en (homeType_status_people)"
    );
    try {
      const homeTypes = await HomeTypeRepository.findAll();
      return homeTypes.map((homeType) => {
        return {
          id: homeType.id,
          name:
            i18n.__(`homeType.${homeType.name}.name`) !==
            `homeType.${homeType.name}.name`
              ? i18n.__(`homeType.${homeType.name}.name`)
              : homeType.name,
          description:
            i18n.__(`homeType.${homeType.name}.name`) !==
            `homeType.${homeType.name}.name`
              ? i18n.__(`homeType.${homeType.name}.description`)
              : homeType.description,
          icon: homeType.icon,
        };
      });
    } catch (error) {
      logger.error("Error en getStatus:", error);
      throw new Error("Error al obtener estados");
    }
  },

  async getPeople() {
    logger.info("Entra a Buscar Las personas en (homeType_status_people)");
    try {
      const people = await Person.findAll();

      return people.map((person) => {
        return {
          id: person.id,
          namePerson: person.name,
          imagePerson: person.image,
        };
      });
    } catch (error) {
      logger.error("Error en getPeople:", error);
      throw new Error("Error al obtener personas");
    }
  },
};

module.exports = HomeController;
