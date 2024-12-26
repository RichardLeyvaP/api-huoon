const { Op } = require("sequelize");
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
  sequelize,
} = require("../models");
const logger = require("../../config/logger");
const ProductRepository = require("./ProductRepository");

class PersonProductRepository {
  async findAll() {
    return await PersonHomeWarehouseProduct.findAll({
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
  }

  async personHomeWarehouseProducts(body) {
    return await PersonHomeWarehouseProduct.findAll({
      where: {
        home_id: body.home_id,
        warehouse_id: body.warehouse_id,
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
  }

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
  }

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
  }

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
  }

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
  }
}

module.exports = new PersonProductRepository();
