const logger = require("../../config/logger"); // Importa el logger
const { EmergencyRepository, TypeRepository } = require("../repositories");
const i18n = require("../../config/i18n-config"); // Importar i18n para traducciones

const EmergencyController = {
  /**
   * Obtener todas las emergencias.
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar las emergencias`); // Registro de la acción
    try {
      const emergencies = await EmergencyRepository.findAll();

      if (!emergencies.length) {
        return res.status(204).json({ msg: "EmergencyNotFound", emergencies: [] });
      }

      // Mapear las emergencias para asegurar que los datos estén en el formato correcto
      const mappedEmergencies = emergencies.map((emergency) => ({
        id: emergency.id,
        date: emergency.date.toISOString().replace("T", " ").slice(0, 16), // Formato "YYYY-MM-DD HH:mm"
        type_id: emergency.type_id,
        typeId: emergency.type_id,
        symptoms: emergency.symptoms,
        actionTaken: emergency.actionTaken,
        contactAlerted: Array.isArray(emergency.contactAlerted)
          ? emergency.contactAlerted // Si ya es un array, úsalo directamente
          : JSON.parse(emergency.contactAlerted || "[]"), // Si es una cadena JSON, parsearla
        location: emergency.location,
        personId: emergency.person_id,
        person_id: emergency.person_id,
      }));

      return res.status(200).json({ emergencies: mappedEmergencies });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("EmergencyController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener una emergencia por su ID.
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca una emergencia`); // Registro de la acción
    try {
      const { id } = req.params;

      // Consulta la emergencia por su ID con las relaciones requeridas
      const emergency = await EmergencyRepository.findById(id);

      // Validación de existencia de la emergencia
      if (!emergency) {
        return res.status(204).json({ msg: "EmergencyNotFound" });
      }

      // Mapear la emergencia para asegurar que los datos estén en el formato correcto
      const mappedEmergency = {
        id: emergency.id,
        date: emergency.date.toISOString().replace("T", " ").slice(0, 16), // Formato "YYYY-MM-DD HH:mm"
        type_id: emergency.type_id,
        typeId: emergency.type_id,
        symptoms: emergency.symptoms,
        actionTaken: emergency.actionTaken,
        contactAlerted: Array.isArray(emergency.contactAlerted)
          ? emergency.contactAlerted // Si ya es un array, úsalo directamente
          : JSON.parse(emergency.contactAlerted || "[]"), // Si es una cadena JSON, parsearla
        location: emergency.location,
        personId: emergency.person_id,
        person_id: emergency.person_id,
      };

      // Respuesta JSON con los datos de la emergencia
      return res.status(200).json({ emergency: mappedEmergency });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("EmergencyController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener las emergencias de una persona específica.
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca las emergencias de una persona`); // Registro de la acción
    try {
      const personId = req.person.id;

      // Consulta las emergencias por el ID de la persona
      const emergencies = await EmergencyRepository.findAllByPersonId(personId);

      if (!emergencies.length) {
        return res.status(204).json({ msg: "EmergencyNotFound", emergencies: [] });
      }

      // Mapear las emergencias para asegurar que los datos estén en el formato correcto
      const mappedEmergencies = emergencies.map((emergency) => {
        const translatedName =
                  i18n.__(`types.${emergency.type.name}.name`) !==
                  `types.${emergency.type.name}.name`
                    ? i18n.__(`types.${emergency.type.name}.name`)
                    : emergency.type.name;
        return {            
        id: emergency.id,
        date: emergency.date.toISOString().replace("T", " ").slice(0, 16), // Formato "YYYY-MM-DD HH:mm"
        type_id: emergency.type_id,
        typeId: emergency.type_id,
        typeName: translatedName,
        symptoms: emergency.symptoms,
        actionTaken: emergency.actionTaken,
        contactAlerted: Array.isArray(emergency.contactAlerted)
          ? emergency.contactAlerted // Si ya es un array, úsalo directamente
          : JSON.parse(emergency.contactAlerted || "[]"), // Si es una cadena JSON, parsearla
        location: emergency.location,
        personId: emergency.person_id,
        person_id: emergency.person_id,
        };
      });

      return res.status(200).json({ emergencies: mappedEmergencies });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("EmergencyController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear una nueva emergencia.
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva emergencia`);
    logger.info("Datos recibidos al crear una emergencia");
    logger.info(JSON.stringify(req.body));

    try {
      req.body.person_id = req.person.id; // Asignar el ID de la persona autenticada
      const { type_id } = req.body;

      // Verificar si el tipo de emergencia existe
      const type = await TypeRepository.findById(type_id);
      if (!type) {
        logger.error(
          `EmergencyController->store: Tipo de emergencia no encontrado con ID ${type_id}`
        );
        return res.status(404).json({ msg: "TypeNotFound" });
      }

      const emergency = await EmergencyRepository.create(req.body);
      res.status(201).json({ emergency });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("EmergencyController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar una emergencia existente.
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza la emergencia con ID ${req.params.id}`);
    logger.info("Datos recibidos al editar una emergencia");
    logger.info(JSON.stringify(req.body));

    const { id } = req.body;
    const { type_id } = req.body;

    try {
      // Buscar la emergencia por ID
      const emergency = await EmergencyRepository.findById(id);

      // Verificación de existencia
      if (!emergency) {
        return res.status(404).json({ msg: "EmergencyNotFound" });
      }

      // Verificar si el tipo de emergencia existe
      if (type_id) {
        const type = await TypeRepository.findById(type_id);
        if (!type) {
          logger.error(
            `EmergencyController->update: Tipo de emergencia no encontrado con ID ${type_id}`
          );
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

      const updatedData = await EmergencyRepository.update(emergency, req.body);
      res.status(200).json({ emergency: updatedData });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("EmergencyController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar una emergencia.
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina emergencia con ID ${req.params.id}`);

    const { id } = req.params;

    try {
      // Buscar la emergencia por ID
      const emergency = await EmergencyRepository.findById(id);

      if (!emergency) {
        return res.status(404).json({ msg: "EmergencyNotFound" });
      }

      await EmergencyRepository.delete(emergency);
      res.status(200).json({ msg: "EmergencyDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("EmergencyController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = EmergencyController;