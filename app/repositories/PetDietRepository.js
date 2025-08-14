// repositories/petDiet.repository.js
const { Op, Sequelize } = require("sequelize");
const { PetDiet, Pet, Type, Home, Person } = require("../models");
const logger = require("../../config/logger");

const PetDietRepository = {
  /**
   * Obtener todas las dietas con relaciones
   */
  async findAll() {
    return await PetDiet.findAll({
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Type,
          as: "type",
          attributes: ["id", "name"],
        },
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
      ],
      order: [["pet", "name", "ASC"]],
    });
  },

  /**
   * Buscar dietas por filtros
   */
  async findByFilters(filters) {
    const where = {};

    if (filters.pet_id) where.pet_id = filters.pet_id;
    if (filters.home_id) where.home_id = filters.home_id;
    if (filters.person_id) where.person_id = filters.person_id;
    if (filters.food_type) where.food_type = { [Op.iLike]: `%${filters.food_type}%` };
    if (filters.brand) where.brand = { [Op.iLike]: `%${filters.brand}%` };
    if (filters.type_id) where.type_id = filters.type_id;

    return await PetDiet.findAll({
      where,
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Type,
          as: "type",
          attributes: ["id", "name"],
        },
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
      ],
      order: [["pet", "name", "ASC"]],
    });
  },

  /**
   * Buscar una dieta por ID
   */
  async findById(id) {
    return await PetDiet.findByPk(id, {
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name", "breed", "age"],
        },
        {
          model: Type,
          as: "type",
          attributes: ["id", "name", "description"],
        },
        {
          model: Home,
          as: "home",
          attributes: ["id", "name", "address"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });
  },

  /**
   * Crear una nueva dieta
   */
  async create(body, t) {
    const {
      name,
      pet_id,
      food_type,
      brand,
      portion_size,
      unit,
      type_id,
      special_instructions,
      home_id,
      person_id,
    } = body;

    try {
      const diet = await PetDiet.create(
        {
          name,
          pet_id,
          food_type,
          brand,
          portion_size,
          unit,
          type_id,
          special_instructions,
          home_id: home_id || null,
          person_id: person_id || null,
        },
        { transaction: t }
      );

      logger.info(`Dieta de mascota creada (ID: ${diet.id})`);
      return diet;
    } catch (err) {
      logger.error(`Error en PetDietRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar una dieta existente
   */
  async update(diet, body, t) {
    const fieldsToUpdate = [
      "name",
      "pet_id",
      "food_type",
      "brand",
      "portion_size",
      "unit",
      "type_id",
      "special_instructions",
      "home_id",
      "person_id",
    ];

    try {
      const updatedData = Object.keys(body)
        .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      if (Object.keys(updatedData).length > 0) {
        await diet.update(updatedData, { transaction: t });
        logger.info(`Dieta de mascota actualizada (ID: ${diet.id})`);
      }

      return diet;
    } catch (err) {
      logger.error(`Error en PetDietRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar una dieta
   */
  async delete(diet) {
    try {
      logger.info(`Dieta de mascota eliminada (ID: ${diet.id})`);
      return await diet.destroy();
    } catch (err) {
      logger.error(`Error en PetDietRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Buscar dietas por mascota
   */
  async findByPetId(petId) {
    return await PetDiet.findAll({
      where: { pet_id: petId },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Type,
          as: "type",
          attributes: ["id", "name"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  /**
   * Buscar dietas por tipo de frecuencia
   */
  async findBytypeId(typeId) {
    return await PetDiet.findAll({
      where: { type_id: typeId },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Type,
          as: "type",
          attributes: ["id", "name"],
        },
      ],
      order: [["pet", "name", "ASC"]],
    });
  },
};

module.exports = PetDietRepository;