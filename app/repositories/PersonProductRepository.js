const { Op, Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");
const ImageService = require("../services/ImageService");
const {
  Person,
  Warehouse,
  HomePerson,
  Home,
  Product,
  PersonHomeWarehouseProduct,
  Status,
  Category,
  PersonWarehouse,
  sequelize,
} = require("../models");
const logger = require("../../config/logger");
const ProductRepository = require("./ProductRepository");

const  PersonProductRepository = {
  async findAll() {

    return await PersonHomeWarehouseProduct.findAll({
      include: [
        {
          model: Home,
          as: "home",
          attributes: ["id", "name"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name", "email"],
        },
        {
          model: Warehouse,
          as: "warehouse",
          attributes: ["id", "title"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name"],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Status,
          as: "status",
          attributes: ["id", "name"],
        },
      ],
    });
  },
  async personHomeWarehouseProducts(body) {
    return await PersonHomeWarehouseProduct.findAll({
      where: {
        home_id: body.home_id,
        warehouse_id: body.warehouse_id,
        quantity: { [Op.gt]: 0 },
      },
      include: [
        {
          model: Home,
          as: "home",
          attributes: ["id", "name"], // Datos del hogar
        },
        {
          model: Warehouse,
          as: "warehouse",
          attributes: ["id", "title", "description", "status"], // Datos del almacén
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "category_id"], // Datos del producto
          include: [
            {
              model: Category,
              as: "category", // Relación con Category
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Status,
          as: "status",
          attributes: ["id", "name"], // Datos del almacén
        },
      ],
    });
  },

  async getTotalQuantityByWarehouse(homeId, warehouseId) {
  const result = await PersonHomeWarehouseProduct.sum('quantity', {
    where: {
      home_id: homeId,
      warehouse_id: warehouseId,
    },
  });
  return result || 0; // Si no hay productos, devuelve 0
},

/*async getVisibleWarehouseIds(homeId, personId, type = null) {
  const warehouses = await PersonWarehouse.findAll({
    attributes: ['warehouse_id'], // Solo necesitamos los IDs
   where: {
      home_id: homeId, // Solo registros de este hogar
      [Op.or]: [
        // 1. Son míos → los muestro sin importar el status (0,1,2)
        {
          person_id: personId,
          status: { [Op.in]: [0, 1, 2] },
        },
        // 2. Son de otros → solo los muestro si status es 1 o 2
        {
          person_id: { [Op.ne]: personId },
          status: { [Op.in]: [1, 2] },
        },
      ],
    },
    raw: true
  });

  return warehouses.map(w => w.warehouse_id);
},*/
async getVisibleWarehouseIds(homeId, personId, type = null) {
  let whereCondition = {
    home_id: homeId,
  };

  if (type === 'Personal') {
    // ✅ SOLO almacenes PRIVADOS del usuario (status = 0)
    whereCondition = {
      ...whereCondition,
      person_id: personId,
      status: 0,
    };
  } else if (type === 'Hogar') {
    // ✅ SOLO almacenes del HOGAR (status 1 o 2), excluyendo los privados del usuario
    whereCondition = {
      ...whereCondition,
      status: { [Op.in]: [1, 2] },
    };
  } else {
    // Comportamiento original (todos los que la persona puede ver)
    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          person_id: personId,
          status: { [Op.in]: [0, 1, 2] },
        },
        {
          //person_id: { [Op.ne]: personId },
          status: { [Op.in]: [1, 2] },
        },
      ],
    };
  }

  const warehouses = await PersonWarehouse.findAll({
    attributes: ['warehouse_id'],
    where: whereCondition,
    raw: true
  });

  return warehouses.map(w => w.warehouse_id);
},
async getTotalQuantityByCategories(homeId, personId, type) {
  // Obtener IDs de almacenes visibles para esta persona
  const visibleWarehouseIds = await this.getVisibleWarehouseIds(homeId, personId, type);

  if (visibleWarehouseIds.length === 0) {
    return []; // Si no hay almacenes visibles, devolver vacío
  }

  const results = await PersonHomeWarehouseProduct.findAll({
    attributes: [
      [sequelize.col('product.category_id'), 'category_id'],
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
    ],
    include: [{
      model: Product,
      as: "product",
      attributes: [],
      required: true
    }],
    where: {
      home_id: homeId,
      warehouse_id: { [Op.in]: visibleWarehouseIds } // ✅ Filtrar solo almacenes visibles
    },
    group: [sequelize.col('product.category_id')],
    raw: true
  });

  return results.map(r => ({
    category_id: parseInt(r.category_id),
    total_quantity: parseInt(r.total_quantity) || 0
  }));
},
async getProductWithLowestStock(homeId, personId, type) {
  const visibleWarehouseIds = await this.getVisibleWarehouseIds(homeId, personId, type);

  if (visibleWarehouseIds.length === 0) {
    return null;
  }

  const product = await PersonHomeWarehouseProduct.findOne({
    attributes: [
      [sequelize.col('product.name'), 'productName'],
      [sequelize.col('quantity'), 'quantity'],
      [sequelize.col('product.id'), 'productId']
    ],
    include: [{
      model: Product,
      as: "product",
      attributes: [],
      required: true
    }],
    where: {
      home_id: homeId,
      warehouse_id: { [Op.in]: visibleWarehouseIds },
      quantity: { [Op.gt]: 0 } // Solo productos con stock > 0
    },
    order: [[sequelize.col('quantity'), 'ASC']],
    raw: true
  });

  return product;
},
/*async getExpiringProductsCountThisMonth(homeId, personId, type) {
  const visibleWarehouseIds = await this.getVisibleWarehouseIds(homeId, personId, type);

  if (visibleWarehouseIds.length === 0) {
    return 0;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await PersonHomeWarehouseProduct.sum('quantity', {
    where: {
      home_id: homeId,
      warehouse_id: { [Op.in]: visibleWarehouseIds },
      expiration_date: {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth
      },
      quantity: { [Op.gt]: 0 }
    }
  });

  return result || 0;
}*/

async getExpiringProductsSummaryThisMonth(homeId, personId, type) {
  const visibleWarehouseIds = await this.getVisibleWarehouseIds(homeId, personId, type);

  if (visibleWarehouseIds.length === 0) {
    return { productCount: 0, unitCount: 0 };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Contar unidades totales que vencen
  const unitCount = await PersonHomeWarehouseProduct.sum('quantity', {
    where: {
      home_id: homeId,
      warehouse_id: { [Op.in]: visibleWarehouseIds },
      expiration_date: {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth
      },
      quantity: { [Op.gt]: 0 }
    }
  });

  // 2. Contar productos DISTINTOS (usando COUNT DISTINCT directamente)
  const productCountResult = await PersonHomeWarehouseProduct.sequelize.query(
    `
    SELECT COUNT(DISTINCT product_id) as productCount
    FROM person_home_warehouse_products
    WHERE home_id = :homeId
      AND warehouse_id IN (:warehouseIds)
      AND expiration_date >= :startOfMonth
      AND expiration_date <= :endOfMonth
      AND quantity > 0
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        homeId,
        warehouseIds: visibleWarehouseIds,
        startOfMonth,
        endOfMonth
      }
    }
  );

  const productCount = productCountResult[0]?.productCount || 0;

  return {
    productCount: parseInt(productCount, 10) || 0,
    unitCount: parseInt(unitCount, 10) || 0
  };
},
/*async getTotalQuantityByCategories(homeId, personId) { // ← ¡Agregamos personId como parámetro!
  const results = await PersonHomeWarehouseProduct.findAll({
    attributes: [
      [sequelize.col('Product.category_id'), 'category_id'],
      [sequelize.fn('SUM', sequelize.col('PersonHomeWarehouseProduct.quantity')), 'total_quantity']
    ],
    include: [
      {
        model: Product,
        as: "product",
        attributes: [],
        required: true
      },
      {
        model: PersonWarehouse, // ← JOIN con PersonWarehouse para verificar visibilidad
        as: "personWarehouse", // ← Asegúrate de que la asociación esté definida así
        required: true,
        where: {
          home_id: homeId, // Redundante, pero por seguridad
          [Op.or]: [
            {
              person_id: personId, // Es mío → cualquier status
              status: { [Op.in]: [0, 1, 2] }
            },
            {
              person_id: { [Op.ne]: personId }, // Es de otro → solo status 1 o 2
              status: { [Op.in]: [1, 2] }
            }
          ]
        },
        attributes: [] // No necesitamos datos, solo para filtrar
      }
    ],
    where: { home_id: homeId },
    group: [sequelize.col('Product.category_id')],
    raw: true
  });

  return results.map(r => ({
    category_id: parseInt(r.category_id),
    total_quantity: parseInt(r.total_quantity) || 0
  }));
},*/
  async getTotalProductsQuantity(body) {
    const { home_id, warehouse_ids, date } = body;
    
    const whereConditions = {
        home_id: home_id
    };

    // Filtro por warehouse_ids si se proporciona
    if (warehouse_ids && warehouse_ids.length > 0) {
        whereConditions.warehouse_id = {
            [Op.in]: warehouse_ids
        };
    }

    // Filtro por fecha (solo parte de fecha)
    if (date) {
        whereConditions.purchase_date = Sequelize.where(
            Sequelize.fn('DATE_FORMAT', 
                Sequelize.col('purchase_date'),
                '%Y-%m-%d'
            ),
            '=',
            date
        );
    }

    const result = await PersonHomeWarehouseProduct.findOne({
        where: whereConditions,
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity']
        ],
        raw: true
    });

    return result ? result.total_quantity || 0 : 0;
  },

  async findById(id) {
    return await PersonHomeWarehouseProduct.findByPk(id, {
      include: [
        {
          model: Home,
          as: "home", // Asociación con el modelo Home
          attributes: ["id", "name"], // Ajusta los atributos de Home que quieres devolver
        },
        {
          model: Person,
          as: "person", // Asociación con el modelo Person
          attributes: ["id", "name", "email"], // Ajusta los atributos de Person según sea necesario
        },
        {
          model: Warehouse,
          as: "warehouse", // Asociación con el modelo Warehouse
          attributes: ["id", "title"], // Ajusta los atributos de Warehouse según sea necesario
        },
        {
          model: Product,
          as: "product", // Asociación con el modelo Product
          attributes: ["id", "name"], // Ajusta los atributos de Product según sea necesario
          include: [
            {
              model: Category,
              as: "category", // Asociación con el modelo Category
              attributes: ["id", "name"], // Ajusta los atributos de Category según sea necesario
            },
          ],
        },
        {
          model: Status,
          as: "status", // Asociación con el modelo Status
          attributes: ["id", "name"], // Ajusta los atributos de Status según sea necesario
        },
      ],
    });
  },

  /*async create(body, file, t, person_id) {
    const {
      home_id,
      warehouse_id,
      product_id,
      status_id,
      unit_price,
      total_price,
      quantity,
      purchase_date,
      purchase_place,
      expiration_date,
      brand,
      additional_notes,
      maintenance_date,
      due_date,
      frequency,
      type,
      image,
      category_id,
      name,
    } = body;
    try {
      // Asociar el producto al almacén y al hogar en `person_home_warehouse_product`
      const [personHomeWarehouseProduct, created] =
        await PersonHomeWarehouseProduct.findOrCreate({
          where: {
            warehouse_id: warehouse_id,
            home_id: home_id,
            person_id: person_id,
            product_id: product_id,
          },
          defaults: {
            status_id: status_id,
            unit_price: unit_price,
            total_price: total_price,
            purchase_date: purchase_date || new Date(), // Usa la fecha actual si purchase_date es nulo o no está definido
            purchase_place: purchase_place,
            expiration_date: expiration_date,
            brand: brand,
            quantity: quantity,
            additional_notes: additional_notes,
            maintenance_date: maintenance_date,
            due_date: due_date,
            frequency: frequency,
            type: type,
            image: "personProducts/default.jpg",
          },
          transaction: t,
        });

      // Copiar la imagen a la nueva carpeta con el ID de `personHomeWarehouseProduct`
      if (file && created) {
        const newFilename = ImageService.generateFilename(
          "personProducts",
          personHomeWarehouseProduct.id,
          file.originalname
        );
        personHomeWarehouseProduct.image = await ImageService.moveFile(file, newFilename);
        await personHomeWarehouseProduct.update({ image: personHomeWarehouseProduct.image }, { transaction: t });
      }
      return personHomeWarehouseProduct;
    } catch (err) {
      logger.error(`Error en PersonProductRepository->store: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },*/

  async create(body, file, t, person_id) {
    const {
      home_id,
      warehouse_id,
      product_id,
      status_id,
      unit_price,
      total_price,
      quantity,
      purchase_date,
      purchase_place,
      expiration_date,
      brand,
      additional_notes,
      maintenance_date,
      due_date,
      frequency,
      type,
      image,
      category_id,
      name,
    } = body;

    try {
      // 1. Buscar o crear el registro
      const [personHomeWarehouseProduct, created] =
        await PersonHomeWarehouseProduct.findOrCreate({
          where: {
            warehouse_id: warehouse_id,
            home_id: home_id,
            person_id: person_id,
            product_id: product_id,
          },
          defaults: {
            status_id: status_id,
            unit_price: unit_price,
            total_price: total_price,
            purchase_date: purchase_date || new Date(),
            purchase_place: purchase_place,
            expiration_date: expiration_date,
            brand: brand,
            quantity: quantity, // ← solo en creación
            additional_notes: additional_notes,
            maintenance_date: maintenance_date,
            due_date: due_date,
            frequency: frequency,
            type: type,
            image: "personProducts/default.jpg",
          },
          transaction: t,
        });

      // 2. Si YA EXISTE → sumar la cantidad (no reemplazar)
      if (!created) {
        await personHomeWarehouseProduct.update(
          {
            // Actualiza todos los campos EXCEPTO quantity
            status_id: status_id,
            unit_price: unit_price,
            total_price: total_price,
            purchase_date: purchase_date || personHomeWarehouseProduct.purchase_date,
            purchase_place: purchase_place,
            expiration_date: expiration_date,
            brand: brand,
            additional_notes: additional_notes,
            maintenance_date: maintenance_date,
            due_date: due_date,
            frequency: frequency,
            type: type,
            // ¡NO actualizamos quantity aquí!
          },
          { transaction: t }
        );

        // Sumar la nueva cantidad a la existente
        await personHomeWarehouseProduct.update(
          {
            quantity: personHomeWarehouseProduct.quantity + (quantity || 0),
          },
          { transaction: t }
        );
      }

      // 3. Manejo de imagen (solo si es nuevo y hay archivo)
      if (file && created) {
        const newFilename = ImageService.generateFilename(
          "personProducts",
          personHomeWarehouseProduct.id,
          file.originalname
        );
        const imagePath = await ImageService.moveFile(file, newFilename);
        await personHomeWarehouseProduct.update({ image: imagePath }, { transaction: t });
      }

      return personHomeWarehouseProduct;
    } catch (err) {
      logger.error(`Error en PersonProductRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(personHomeWarehouseProduct, body, file, t) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "home_id",
      "warehouse_id",
      "product_id",
      "status_id",
      "unit_price",
      "total_price",
      "quantity",
      "purchase_date",
      "expiration_date",
      "purchase_place",
      "brand",
      "additional_notes",
      "maintenance_date",
      "due_date",
      "frequency",
      "type",
      "image",
    ];
    try {
      // Filtrar campos en req.body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Procesar la imagen si se sube una nueva
      if (file) {
        // Eliminar la imagen anterior si no es la predeterminada
        if (personHomeWarehouseProduct.image && personHomeWarehouseProduct.image !== "personProducts/default.jpg" ) {
          await ImageService.deleteFile(personHomeWarehouseProduct.image);
        }

        const newFilename = ImageService.generateFilename('personProducts', personHomeWarehouseProduct.id, file.originalname);
        updatedData.image = await ImageService.moveFile(file, newFilename);
      }

      // Actualizar la tarea solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await personHomeWarehouseProduct.update(updatedData, {
          transaction: t,
        });
        logger.info(
          `Producto actualizada exitosamente (ID: ${personHomeWarehouseProduct.id})`
        );
      }

      return personHomeWarehouseProduct;
    } catch (err) {
      logger.error(`Error en PersonProductRepository->update: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  async moveProduct(body, t) {
    const { id, warehouse_id: target_warehouse_id, product_id, quantity_mov } = body;

    try {
      // 1. Obtener el registro original (de donde se mueve el producto)
      const originalRecord = await PersonHomeWarehouseProduct.findByPk(id, { transaction: t });
      if (!originalRecord) {
        throw new Error('Original record not found');
      }

      // Validar que hay suficiente stock
      if (originalRecord.quantity < quantity_mov) {
        throw new Error('Insufficient quantity to move');
      }

      // 2. Decrementar la cantidad en el registro original
      originalRecord.quantity -= quantity_mov;
      await originalRecord.save({ transaction: t });

      // 3. Buscar o crear el registro destino (en el almacén destino)
      const [targetRecord, created] = await PersonHomeWarehouseProduct.findOrCreate({
        where: {
          warehouse_id: target_warehouse_id,
          home_id: originalRecord.home_id, // mismo hogar
          person_id: originalRecord.person_id, // misma persona
          product_id: product_id,
        },
        defaults: {
          status_id: originalRecord.status_id,
          unit_price: originalRecord.unit_price,
          total_price: originalRecord.unit_price * quantity_mov,
          purchase_date: originalRecord.purchase_date,
          expiration_date: originalRecord.expiration_date,
          brand: originalRecord.brand,
          quantity: quantity_mov, // nueva cantidad
          additional_notes: originalRecord.additional_notes,
          maintenance_date: originalRecord.maintenance_date,
          due_date: originalRecord.due_date,
          frequency: originalRecord.frequency,
          type: originalRecord.type,
          image: originalRecord.image,
        },
        transaction: t,
      });

      // 4. Si ya existía, incrementar la cantidad
      if (!created) {
        targetRecord.quantity += quantity_mov;
        targetRecord.total_price += targetRecord.unit_price * targetRecord.quantity;
        await targetRecord.save({ transaction: t });
      }

      logger.info(`Producto movido exitosamente: ${quantity_mov} unidades de registro ${id} a almacén ${target_warehouse_id}`);
      return { originalRecord, targetRecord };
    } catch (err) {
      logger.error(`Error en PersonProductRepository->moveProduct: ${err.message}`);
      throw err;
    }
  },

  async delete(personHomeWarehouseProduct) {
    // Verificar y eliminar la imagen si no es la predeterminada
    if ( personHomeWarehouseProduct.image && personHomeWarehouseProduct.image !== "personProducts/default.jpg" ) {
      await ImageService.deleteFile(personHomeWarehouseProduct.image);
    }

    const product = await ProductRepository.findById( personHomeWarehouseProduct.product_id );

    if (product.image && product.image !== "products/default.jpg") {
      await ImageService.deleteFile(product.image);
    }

    // Eliminar el registro de la tabla
    logger.info(
      `Registro eliminado de PersonHomeWarehouseProduct con ID ${personHomeWarehouseProduct.id}`
    );
    const personHomeWarehouseProductDelete = await personHomeWarehouseProduct.destroy();
    logger.info(`Registro eliminado de Product con ID ${product.id}`);
    // Eliminar el registro de la tabla
    await product.destroy();

    return personHomeWarehouseProductDelete;
  },

  async findOneByFilters(product_id, warehouse_id, home_id, person_id) {
    // Construir el objeto where dinámicamente
    const whereClause = {};
    if (home_id) whereClause.home_id = home_id;
    if (product_id) whereClause.product_id = product_id;
    if (warehouse_id) whereClause.warehouse_id = warehouse_id;
    if (person_id) whereClause.person_id = person_id;

    try {
      const result = await PersonHomeWarehouseProduct.findOne({
        where: whereClause,
        include: [
          {
            model: Home,
            as: "home",
            attributes: ["id", "name"],
          },
          {
            model: Person,
            as: "person",
            attributes: ["id", "name", "email"],
          },
          {
            model: Warehouse,
            as: "warehouse",
            attributes: ["id", "title"],
          },
          {
            model: Product,
            as: "product",
            attributes: ["id", "name"],
            include: [
              {
                model: Category,
                as: "category",
                attributes: ["id", "name"],
              },
            ],
          },
          {
            model: Status,
            as: "status",
            attributes: ["id", "name"],
          },
        ]
      });
      return result;
      
    } catch (error) {
      logger.error('Error en findOneByFilters:', error);
      throw error;
    }
  },

  async updateExistingProduct(existingRecord, updateData, transaction = null) {
  const { quantity, unit_price, purchase_date, purchase_place, total_price } = updateData;
  
  
  const currentQty = parseFloat(existingRecord.quantity);
  const currentTotal = parseFloat(existingRecord.total_price);
  const newQty = currentQty + parseFloat(quantity);
  const newTotal = currentTotal + parseFloat(total_price);

  logger.info(`Updating: Qty ${currentQty} -> ${newQty} | Total ${currentTotal} -> ${newTotal}`);

  return await existingRecord.update({
    quantity: newQty,
    unit_price: unit_price || existingRecord.unit_price,
    total_price: newTotal,
    purchase_date: purchase_date || existingRecord.purchase_date,
    purchase_place: purchase_place || existingRecord.purchase_place
  }, { transaction });
  },
}

module.exports = PersonProductRepository;
