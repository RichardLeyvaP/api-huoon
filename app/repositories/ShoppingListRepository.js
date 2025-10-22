// app/repositories/ShoppingListRepository.js
const { ShoppingList, Person, Home } = require("../models");
const logger = require("../../config/logger");

const ShoppingListRepository = {
  async findAll() {
    try {
      const items = await ShoppingList.findAll({
        attributes: [
          "id", "person_id", "home_id", "date", "person_home_warehouse_product_id",
          "product_id", "product_name", "image", "quantity", "reason", "status"
        ],
        include: [
          { model: Person, as: "person", attributes: ["id", "name"] },
          { model: Home, as: "home", attributes: ["id", "name"] }
        ],
        order: [["date", "DESC"], ["createdAt", "DESC"]]
      });
      return items;
    } catch (error) {
      logger.error("Error en ShoppingListRepository->findAll:", error);
      throw new Error(`Error al obtener ítems de lista: ${error.message}`);
    }
  },

  async findByHomeId(homeId) {
    try {
      const items = await ShoppingList.findAll({
        where: { home_id: homeId },
        attributes: [
          "id", "person_id", "date", "product_id", "product_name",
          "image", "quantity", "reason", "status"
        ],
        include: [
          { model: Person, as: "person", attributes: ["id", "name"] }
        ],
        order: [["date", "DESC"], ["status", "ASC"]]
      });
      return items;
    } catch (error) {
      logger.error(`Error en ShoppingListRepository->findByHomeId (home_id: ${homeId}):`, error);
      throw new Error(`Error al obtener ítems por hogar: ${error.message}`);
    }
  },

  async findByPersonId(personId) {
    try {
      const items = await ShoppingList.findAll({
        where: { person_id: personId },
        attributes: [
          "id", "home_id", "date", "product_id", "product_name",
          "image", "quantity", "reason", "status"
        ],
        include: [
          { model: Home, as: "home", attributes: ["id", "name"] }
        ],
        order: [["date", "DESC"]]
      });
      return items;
    } catch (error) {
      logger.error(`Error en ShoppingListRepository->findByPersonId (person_id: ${personId}):`, error);
      throw new Error(`Error al obtener ítems por persona: ${error.message}`);
    }
  },

  async findByPersonAndHome(personId, homeId) {
    try {
        const items = await ShoppingList.findAll({
        where: { person_id: personId, home_id: homeId },
        attributes: [
            "id",
            "person_home_warehouse_product_id",
            "product_id",
            "product_name",
            "image",
            "quantity",
            "reason",
            "status",
            "date"
        ],
        order: [["createdAt", "ASC"]]
        });
        return items;
    } catch (error) {
        logger.error(`Error en findByPersonAndHome (person: ${personId}, home: ${homeId}):`, error);
        throw new Error(`Error al obtener lista de compras: ${error.message}`);
    }
    },

  async create(data, t) {
    try {
      const {
        person_id,
        home_id,
        date,
        person_home_warehouse_product_id,
        product_id,
        product_name,
        image,
        quantity = 1,
        reason,
        status = 'pending'
      } = data;

      const item = await ShoppingList.create({
        person_id,
        home_id,
        date,
        person_home_warehouse_product_id: person_home_warehouse_product_id || null,
        product_id,
        product_name,
        image: image || null,
        quantity,
        reason: reason || null,
        status
      }, { transaction: t });

      logger.info(`Ítem de lista creado (ID: ${item.id})`);
      return item;
    } catch (error) {
      logger.error("Error en ShoppingListRepository->create:", error);
      throw new Error(`Error al crear ítem: ${error.message}`);
    }
  },

   async getCurrentLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  async syncListForPersonInHome(personId, homeId, productsArray, t) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Paso 1: Obtener ítems actuales en DB
    const existingItems = await ShoppingList.findAll({
      where: { person_id: personId, home_id: homeId },
      transaction: t
    });

    const existingMap = new Map();
    existingItems.forEach(item => {
      const key = `${item.person_home_warehouse_product_id || 'null'}-${item.product_id}`;
      existingMap.set(key, item);
    });

    const incomingKeys = new Set();

    // Paso 2: Procesar cada ítem del array entrante
    for (const product of productsArray) {
      const {
        person_home_warehouse_product_id,
        product_id,
        name,
        image,
        quantity,
        reason
      } = product;

      const key = `${person_home_warehouse_product_id || 'null'}-${product_id}`;
      incomingKeys.add(key);

      const existingItem = existingMap.get(key);

      if (existingItem) {
        // ✅ Actualizar
        await existingItem.update({
          product_name: name,
          image: image || null,
          quantity: quantity || 1,
          reason: reason || null,
          status: 'Pendiente', // o mantener el status actual si prefieres
          date: today
        }, { transaction: t });
      } else {
        // ➕ Insertar nuevo
        await ShoppingList.create({
          person_id: personId,
          home_id: homeId,
          person_home_warehouse_product_id: person_home_warehouse_product_id || null,
          product_id,
          product_name: name,
          image: image || null,
          quantity: quantity || 1,
          reason: reason || null,
          status: 'Pendiente',
          date: today
        }, { transaction: t });
      }
    }

    // Paso 3: Eliminar ítems que ya no están en el array entrante
    for (const [key, item] of existingMap.entries()) {
      if (!incomingKeys.has(key)) {
        await item.destroy({ transaction: t });
      }
    }

    const updatedItems = await ShoppingList.findAll({
      where: { person_id: personId, home_id: homeId },
      transaction: t,
      order: [['createdAt', 'ASC']]
    });

    // ✅ Formatear al estilo del frontend
    const formattedProducts = updatedItems.map(item => ({
      id: item.id, // <-- nuevo campo solicitado
      date: item.date,
      person_home_warehouse_product_id: item.person_home_warehouse_product_id,
      product_id: item.product_id,
      person_id: item.person_id,
      home_id: item.home_id,
      name: item.product_name,
      image: item.image,
      quantity: item.quantity,
      reason: item.reason,
      status: item.status
    }));

    //logger.info(`Lista sincronizada para persona ${personId} en hogar ${homeId}`);
    return formattedProducts; // 👈 ahora devuelve los datos formateados
    } catch (error) {
        logger.error(`Error en syncListForPersonInHome:`, error);
        throw new Error(`Error al sincronizar lista de compras: ${error.message}`);
    }
    },

  async update(item, data, t) {
    try {
      const updatableFields = [
        "date", "person_home_warehouse_product_id", "product_id", "product_name",
        "image", "quantity", "reason", "status"
      ];

      const updateData = {};
      updatableFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      if (Object.keys(updateData).length > 0) {
        await item.update(updateData, { transaction: t });
        logger.info(`Ítem actualizado (ID: ${item.id})`);
      }

      return item;
    } catch (error) {
      logger.error(`Error en ShoppingListRepository->update (ID: ${item.id}):`, error);
      throw new Error(`Error al actualizar ítem: ${error.message}`);
    }
  },

  async delete(item) {
    try {
      await item.destroy();
      logger.info(`Ítem eliminado (ID: ${item.id})`);
      return { success: true, message: "Ítem de lista eliminado" };
    } catch (error) {
      logger.error(`Error en ShoppingListRepository->delete (ID: ${item.id}):`, error);
      throw new Error(`Error al eliminar ítem: ${error.message}`);
    }
  }
};

module.exports = ShoppingListRepository;