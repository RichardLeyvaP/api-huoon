const { Op, Sequelize } = require("sequelize");
const ImageService = require("../services/ImageService");
const {
  Pet,
  Home,
  Person,
  Category,
} = require("../models");
const logger = require("../../config/logger");

const PetRepository = {
  /**
   * Obtener todas las mascotas con sus relaciones
   */
  async findAll() {
    return await Pet.findAll({
      include: [
        {
          model: Category,
          as: "category",
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
      order: [["name", "ASC"]],
    });
  },

  /**
   * Buscar mascotas por filtros (home_id, person_id, type, etc.)
   */
  async findByFilters(filters) {
    const where = {};

    if (filters.home_id) where.home_id = filters.home_id;
    if (filters.person_id) where.person_id = filters.person_id;
    if (filters.type) where.type = filters.type;
    if (filters.category_id) where.category_id = filters.category_id;

    return await Pet.findAll({
      where,
      include: [
        {
          model: Category,
          as: "category",
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
      order: [["name", "ASC"]],
    });
  },

  /**
   * Buscar una mascota por ID con relaciones
   */
  async findById(id) {
    return await Pet.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
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
   * Crear una nueva mascota
   */
  async create(body, file, t) {
    const {
      name,
      category_id,
      breed,
      sex,
      age,
      date_birth,
      color,
      microchip,
      signs,
      type,
      home_id,
      person_id,
    } = body;

    try {
      // Crear la mascota
      const pet = await Pet.create(
        {
          name,
          category_id,
          breed,
          sex,
          age,
          date_birth,
          color,
          microchip,
          signs,
          type,
          home_id: home_id || null,
          person_id: person_id || null,
          image: file ? "pets/default.jpg" : "pets/default.jpg", // imagen temporal
        },
        { transaction: t }
      );

      // Subir imagen si existe
      if (file) {
        const newFilename = ImageService.generateFilename(
          "pets",
          pet.id,
          file.originalname
        );
        const imagePath = await ImageService.moveFile(file, newFilename);
        await pet.update({ image: imagePath }, { transaction: t });
      }

      logger.info(`Mascota creada exitosamente (ID: ${pet.id})`);
      return pet;
    } catch (err) {
      logger.error(`Error en PetRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar una mascota existente
   */
  async update(pet, body, file, t) {
    const fieldsToUpdate = [
      "name",
      "category_id",
      "breed",
      "sex",
      "age",
      "date_birth",
      "color",
      "microchip",
      "signs",
      "type",
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

      // Manejo de imagen
      if (file) {
        // Eliminar imagen anterior si no es la predeterminada
        if (
          pet.image &&
          pet.image !== "pets/default.jpg"
        ) {
          await ImageService.deleteFile(pet.image);
        }

        const newFilename = ImageService.generateFilename(
          "pets",
          pet.id,
          file.originalname
        );
        updatedData.image = await ImageService.moveFile(file, newFilename);
      }

      // Actualizar solo si hay cambios
      if (Object.keys(updatedData).length > 0) {
        await pet.update(updatedData, { transaction: t });
        logger.info(`Mascota actualizada (ID: ${pet.id})`);
      }

      return pet;
    } catch (err) {
      logger.error(`Error en PetRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar una mascota (con eliminación de imagen)
   */
  async delete(pet) {
    try {
      // Eliminar imagen si no es la predeterminada
      if (pet.image && pet.image !== "pets/default.jpg") {
        await ImageService.deleteFile(pet.image);
      }

      logger.info(`Mascota eliminada (ID: ${pet.id})`);
      return await pet.destroy();
    } catch (err) {
      logger.error(`Error en PetRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Buscar una mascota por microchip (único)
   */
  async findByMicrochip(microchip) {
    if (!microchip) return null;
    return await Pet.findOne({
      where: { microchip },
    });
  },

  /**
   * Buscar mascotas por hogar
   */
  async findByHomeId(homeId) {
    return await Pet.findAll({
      where: { home_id: homeId },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });
  },

  /**
   * Buscar mascotas por persona (dueño personal)
   */
  async findByPersonId(personId, homeId = null) {
    const whereClause = { person_id: personId };
  
  // Si homeId está definido, lo agregamos al filtro
  if (homeId !== null && homeId !== undefined) {
    whereClause.home_id = homeId;
  }

  return await this.findAll({
    where: whereClause,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Home,
          as: "home",
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });
  },

  /**
   * Contar mascotas por hogar
   */
  async countByHome(homeId) {
    return await Pet.count({
      where: { home_id: homeId },
    });
  },

  /**
   * Contar mascotas por especie (category_id)
   */
  async countByCategory(categoryId) {
    return await Pet.count({
      where: { category_id: categoryId },
    });
  },
};

module.exports = PetRepository;