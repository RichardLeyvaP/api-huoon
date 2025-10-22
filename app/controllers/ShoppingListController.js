const logger = require("../../config/logger");
const { ShoppingListRepository, HomeRepository, PersonRepository, PersonProductRepository } = require("../repositories");
const { sequelize } = require("../models");

const ShoppingListController = {
  async index(req, res) {
    try {
      const items = await ShoppingListRepository.findAll();
      if (!items.length) return res.status(204).json({ msg: "NoShoppingLists", items: [] });
      return res.status(200).json({ items });
    } catch (err) {
      logger.error("ShoppingListController->index: " + err.message);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async show(req, res) {
    try {
      const item = await ShoppingListRepository.findById(req.body.id);
      if (!item) return res.status(404).json({ msg: "ShoppingListNotFound" });
      return res.status(200).json({ item });
    } catch (err) {
      logger.error("ShoppingListController->show: " + err.message);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByHomeId(req, res) {
    const { home_id } = req.body;
    if (!home_id) return res.status(400).json({ msg: "HomeIdIsRequired" });

    try {
      const items = await ShoppingListRepository.findByHomeId(home_id);
      return res.status(200).json({ items });
    } catch (err) {
      logger.error(`ShoppingListController->getByHomeId (home_id: ${home_id}): ${err.message}`);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByPersonId(req, res) {
    const { person_id } = req.body;
    if (!person_id) return res.status(400).json({ msg: "PersonIdIsRequired" });

    try {
      const items = await ShoppingListRepository.findByPersonId(person_id);
      return res.status(200).json({ items });
    } catch (err) {
      logger.error(`ShoppingListController->getByPersonId (person_id: ${person_id}): ${err.message}`);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async store(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Crea ítem en lista de compras`);
    const t = await sequelize.transaction();
    try {
      const item = await ShoppingListRepository.create(req.body, t);
      await t.commit();
      const fullItem = await ShoppingListRepository.findById(item.id);
      return res.status(201).json({ item: fullItem });
    } catch (err) {
      await t.rollback();
      logger.error("ShoppingListController->store: " + err.message);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async update(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Actualiza ítem (ID: ${req.body.id})`);
    const { id } = req.body;

    try {
      const item = await ShoppingListRepository.findById(id);
      if (!item) return res.status(404).json({ msg: "ShoppingListNotFound" });

      const t = await sequelize.transaction();
      try {
        const updated = await ShoppingListRepository.update(item, req.body, t);
        await t.commit();
        return res.status(200).json({ item: updated });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      logger.error("ShoppingListController->update: " + err.message);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const item = await ShoppingListRepository.findById(req.body.id);
      if (!item) return res.status(404).json({ msg: "ShoppingListNotFound" });
      await ShoppingListRepository.delete(item);
      return res.status(200).json({ msg: "ShoppingListDeleted" });
    } catch (err) {
      logger.error("ShoppingListController->destroy: " + err.message);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByPersonAndHome(req, res) {
  const { person_id, home_id } = req.body;

  if (!person_id || !home_id) {
    return res.status(400).json({ msg: "person_id y home_id son requeridos" });
  }

  try {
    const items = await ShoppingListRepository.findByPersonAndHome(person_id, home_id);
    return res.status(200).json({ items });
  } catch (err) {
    logger.error(`ShoppingListController->getByPersonAndHome: ${err.message}`);
    return res.status(500).json({ error: "ServerError", details: err.message });
  }
},

// Endpoint 2: Sincronizar lista completa desde un array
async syncList(req, res) {
  const { person_id, home_id, products = [] } = req.body;

  if (!person_id || !home_id) {
    return res.status(400).json({ msg: "person_id y home_id son requeridos" });
  }

  if (!Array.isArray(products)) {
    return res.status(400).json({ msg: "El campo 'products' debe ser un array" });
  }

  // Validar esquema de cada producto (opcional, pero recomendado)
  for (const p of products) {
    if (!p.product_id || !p.name) {
      return res.status(400).json({ msg: "Cada producto debe tener 'product_id' y 'name'" });
    }
  }

  const t = await sequelize.transaction();
  try {
    await ShoppingListRepository.syncListForPersonInHome(person_id, home_id, products, t);
    await t.commit();

    // Devolver la lista actualizada
    const updatedList = await ShoppingListRepository.findByPersonAndHome(person_id, home_id);
    return res.status(200).json({ msg: "Lista sincronizada", items: updatedList });
  } catch (err) {
    await t.rollback();
    logger.error(`ShoppingListController->syncList: ${err.message}`);
    return res.status(500).json({ error: "ServerError", details: err.message });
  }
},
async getShoppingList(req, res) {
  logger.info(
    `${req.user?.name || "Anonymous"} - Obtiene lista de compra sugerida`
  );

  const { home_id, person_id: bodyPersonId } = req.body;
  const person_id = bodyPersonId || req.person?.id;

  const t = await sequelize.transaction();
  try {
    // Validar hogar
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      await t.rollback(); // 👈 Mejor hacer rollback si no se usa
      return res
        .status(404)
        .json({ error: "HomeNotFound", details: "El hogar no existe" });
    }

    // Verificar que la persona pertenece al hogar
    const personInHome = await PersonRepository.getPersonHouse(
      person_id,
      home_id
    );
    if (!personInHome) {
      await t.rollback();
      return res
        .status(403)
        .json({
          error: "PersonNotAssociatedWithHome",
          details: "La persona no pertenece al hogar",
        });
    }

    // Obtener lista sugerida
    const suggestedItems =
      await PersonProductRepository.getSuggestedShoppingList(
        person_id,
        home_id
      );

    if (!suggestedItems || suggestedItems.length === 0) {
      await t.rollback(); // No se hizo nada, pero es limpio
      return res.status(200).json({
        products: [],
        message: "No se requiere reposición en este momento",
      });
    }

    // ✅ ¡IMPORTANTE! Usar AWAIT aquí
    const listSuggested = await ShoppingListRepository.syncListForPersonInHome(
      person_id,
      home_id,
      suggestedItems,
      t
    );

    // Ahora sí, commit
    await t.commit();

    return res.status(200).json({ products: listSuggested });
  } catch (error) {
    await t.rollback(); // Asegurar rollback en error
    const errorMsg = error.message || "Error desconocido";
    logger.error("ShoppingListController->getShoppingList: " + errorMsg);
    return res.status(500).json({ error: "ServerError", details: errorMsg });
  }
},
};

module.exports = ShoppingListController;