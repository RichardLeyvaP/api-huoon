const { Finance, Person, sequelize } = require("../models"); // Importar el modelo Finance
const logger = require("../../config/logger"); // Importa el logger
const i18n = require("../../config/i18n-config");
const {
  FinanceRepository,
  PersonRepository,
  HomeRepository,
} = require("../repositories"); // Asegúrate de que tengas un repositorio para Finance

const FinanceController = {
  // Obtener todos los registros de finanzas
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar los registros financieros`);

    try {
      const finances = await FinanceRepository.findAll();

      if (!finances.length) {
        return res.status(204).json({ msg: "FinancesNotFound" });
      }

      // Mapear la respuesta
      const mappedFinances = finances.map((finance) => {
        return {
          id: finance.id,
          homeId: finance.home_id,
          home_id: finance.home_id,
          personId: finance.person_id,
          person_d: finance.person_id,
          spent: finance.spent,
          income: finance.income,
          date: finance.date,
          description: finance.description,
          type:i18n.__(`finances.${finance.type}.name`) !==
            `finances.${finance.type}.name`
              ? i18n.__(`finances.${finance.type}.name`)
              : finance.type,
          method: finance.method,
          image: finance.image,
        };
      });

      res.status(200).json({ finances: mappedFinances });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getTypeFinances(req, res) {
    logger.info(`${req.user.name} - Entra a buscar los registros financieros`);

    const { home_id, type } = req.body;
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `FinanceController->getHomeFinances : Hogar no encontrado con ID ${home_id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }    
    const person_id = req.person.id;

    try {
      let finances = [];
      if (type === 'Hogar') {
        finances = await FinanceRepository.findAllType(home_id, null,type);
      }
      else if (type === 'Personal'){
        finances = await FinanceRepository.findAllType(person_id, null,type);
      }else{
        finances = await FinanceRepository.findAllType(person_id, home_id, type);
      }


      if (!finances.length) {
        return res.status(204).json({ msg: "FinancesNotFound" });
      }

      // Mapear la respuesta
      const mappedFinances = finances.map((finance) => {
        return {
          id: finance.id,
          homeId: finance.home_id,
          home_id: finance.home_id,
          personId: finance.person_id,
          person_d: finance.person_id,
          spent: finance.spent,
          income: finance.income,
          date: finance.date,
          description: finance.description,
          type:i18n.__(`finances.${finance.type}.name`) !==
            `finances.${finance.type}.name`
              ? i18n.__(`finances.${finance.type}.name`)
              : finance.type,
          method: finance.method,
          image: finance.image,
        };
      });

      res.status(200).json({ finances: mappedFinances });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear un nuevo registro financiero
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo registro financiero`);
    logger.info("datos recibidos al crear una finanza");
    logger.info(JSON.stringify(req.body));

    req.body.person_id = req.person.id;
    const {
      home_id,
      person_id,
      spent,
      income,
      date,
      description,
      type,
      method,
      image,
    } = req.body;

    // Verificar si la persona existe
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `FinanceController->store: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }

    // Verificar si la persona existe y pertenece al hogar
    const person = await PersonRepository.getPersonHouse(person_id, home_id);

    if (!person) {
      logger.error(
        `PersonWarehouseController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`
      );
      return res.status(404).json({ msg: "PersonNotAssociatedWithHome" });
    }

    const t = await sequelize.transaction();
    try {
      const finance = await FinanceRepository.create(req.body, req.file, t);
      await t.commit();
      res.status(201).json({ finance });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener un registro financiero por ID
  async show(req, res) {
    logger.info(`${req.user.name} - Entra a buscar un registro financiero`);

    const id = req.body.id; // Asegúrate de convertir a número

    try {
      const finance = await FinanceRepository.findById(id);

      if (!finance) {
        return res.status(404).json({ msg: "FinanceNotFound" });
      }

      const mappedFinance = {
        id: finance.id,
        homeId: finance.home_id,
        home_id: finance.home_id,
        personId: finance.person_id,
        person_d: finance.person_id,
        spent: finance.spent,
        income: finance.income,
        date: finance.date,
        description: finance.description,
        type:i18n.__(`finances.${finance.type}.name`) !==
            `finances.${finance.type}.name`
              ? i18n.__(`finances.${finance.type}.name`)
              : finance.type,
        method: finance.method,
        image: finance.image,
      };

      res.status(200).json({ finance: mappedFinance });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un registro financiero
  async update(req, res) {
    logger.info(
      `${req.user.name} - Actualiza el registro financiero con ID ${req.body.id}`
    );
    logger.info("datos recibidos al editar una finanza");
    logger.info(JSON.stringify(req.body));

    const {
      id,
      home_id,
      person_id,
      spent,
      income,
      date,
      description,
      type,
      method,
      image,
    } = req.body;

    const finance = await FinanceRepository.findById(id);

    if (!finance) {
      logger.error(
        `FinanceController->update: Registro financiero no encontrado con ID ${id}`
      );
      return res.status(404).json({ msg: "FinanceNotFound" });
    }

    // Verificar si la persona existe
    if (home_id) {
      // Verificar si el hogar existe
      const home = await HomeRepository.findById(home_id);
      if (!home) {
        logger.error(
          `PersonWarehouseController->update: Hogar no encontrado con ID ${home_id}`
        );
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      // Verificar si la persona existe y pertenece al hogar
      const person = await PersonRepository.getPersonHouse(person_id, home_id);

      if (!person) {
        logger.error(
          `PersonWarehouseController->update: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`
        );
        return res.status(204).json({ msg: "PersonNotAssociatedWithHome" });
      }
    }

    const t = await sequelize.transaction();
    try {
      const financeUpdate = await FinanceRepository.update(
        finance,
        req.body,
        req.file,
        t
      );
      await t.commit();
      res.status(200).json({ finance: financeUpdate });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un registro financiero
  async destroy(req, res) {
    logger.info(
      `${req.user.name} - Elimina el registro financiero con ID ${req.body.id}`
    );

    try {
      const finance = await FinanceRepository.findById(req.body.id);

      if (!finance) {
        return res.status(404).json({ msg: "FinanceNotFound" });
      }

      await FinanceRepository.delete(finance);

      res.status(200).json({ msg: "FinanceDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = FinanceController;
