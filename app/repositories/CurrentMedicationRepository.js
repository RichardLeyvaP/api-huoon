// repositories/currentMedication.repository.js
const { Op, Sequelize } = require("sequelize");
const { CurrentMedication, Pet, Type, Home, Person } = require("../models");
const logger = require("../../config/logger");

const CurrentMedicationRepository = {
  /**
   * Obtener todos los medicamentos activos con relaciones
   */
  async findAll() {
    return await CurrentMedication.findAll({
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
      order: [["name", "ASC"]],
    });
  },

  /**
   * Buscar medicamentos por filtros
   */
  async findByFilters(filters) {
    const where = {};

    if (filters.pet_id) where.pet_id = filters.pet_id;
    if (filters.home_id) where.home_id = filters.home_id;
    if (filters.person_id) where.person_id = filters.person_id;
    if (filters.name) where.name = { [Op.iLike]: `%${filters.name}%` };
    if (filters.route) where.route = { [Op.iLike]: `%${filters.route}%` };
    if (filters.type_id) where.type_id = filters.type_id;
    if (filters.start_date) where.start_date = Sequelize.where(
      Sequelize.fn('DATE', Sequelize.col('start_date')),
      '=',
      filters.start_date
    );
    if (filters.end_date) where.end_date = Sequelize.where(
      Sequelize.fn('DATE', Sequelize.col('end_date')),
      '=',
      filters.end_date
    );

    // Filtro: ¿activo? (end_date >= hoy o end_date es null)
    if (filters.active === true) {
      where[Op.or] = [
        { end_date: { [Op.is]: null } },
        { end_date: { [Op.gte]: new Date().toISOString().split('T')[0] } }
      ];
    }

    return await CurrentMedication.findAll({
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
      order: [["name", "ASC"]],
    });
  },

  /**
   * Buscar un medicamento por ID
   */
  async findById(id) {
    return await CurrentMedication.findByPk(id, {
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
   * Crear un nuevo medicamento en curso
   */
  async create(body, t) {
    const {
      pet_id,
      name,
      dosage,
      unit,
      type_id,
      route,
      start_date,
      end_date,
      notes,
      prescribed_by,
      home_id,
      person_id,
    } = body;

    try {
      const medication = await CurrentMedication.create(
        {
          pet_id,
          name,
          dosage,
          unit,
          type_id: type_id || null,
          route,
          start_date,
          end_date: end_date || null,
          notes,
          prescribed_by,
          home_id: home_id || null,
          person_id: person_id || null,
        },
        { transaction: t }
      );

      logger.info(`Medicamento en curso creado (ID: ${medication.id})`);
      return medication;
    } catch (err) {
      logger.error(`Error en CurrentMedicationRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar un medicamento existente
   */
  async update(medication, body, t) {
    const fieldsToUpdate = [
      "pet_id",
      "name",
      "dosage",
      "unit",
      "type_id",
      "route",
      "start_date",
      "end_date",
      "notes",
      "prescribed_by",
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
        await medication.update(updatedData, { transaction: t });
        logger.info(`Medicamento en curso actualizado (ID: ${medication.id})`);
      }

      return medication;
    } catch (err) {
      logger.error(`Error en CurrentMedicationRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar un medicamento
   */
  async delete(medication) {
    try {
      logger.info(`Medicamento en curso eliminado (ID: ${medication.id})`);
      return await medication.destroy();
    } catch (err) {
      logger.error(`Error en CurrentMedicationRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Buscar medicamentos por mascota
   */
  async findByPetId(petId) {
    return await CurrentMedication.findAll({
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
      ],
      order: [["name", "ASC"]],
    });
  },

  /**
   * Buscar medicamentos activos (sin fecha de fin o futura)
   */
  async findActive() {
    return await CurrentMedication.findAll({
      where: {
        [Op.or]: [
          { end_date: { [Op.is]: null } },
          { end_date: { [Op.gte]: new Date().toISOString().split('T')[0] } }
        ]
      },
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
      order: [["pet_id", "ASC"], ["name", "ASC"]],
    });
  },

  /**
   * Buscar medicamentos por tipo (type_id)
   */
  async findByTypeId(typeId) {
    return await CurrentMedication.findAll({
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
      order: [["name", "ASC"]],
    });
  },
};

module.exports = CurrentMedicationRepository;