const { Op, Sequelize } = require("sequelize");
const {
  PetTreatment,
  Pet,
  Home,
  Person,
} = require("../models");
const logger = require("../../config/logger");

const PetTreatmentRepository = {
  /**
   * Obtener todos los tratamientos con sus relaciones
   */
  async findAll() {
    return await PetTreatment.findAll({
      include: [
        {
          model: Pet,
          as: "pet",
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
      order: [["date", "DESC"], ["name", "ASC"]],
    });
  },

  /**
   * Buscar tratamientos por filtros (pet_id, home_id, type, fechas, etc.)
   */
  async findByFilters(filters) {
    const where = {};

    if (filters.pet_id) where.pet_id = filters.pet_id;
    if (filters.home_id) where.home_id = filters.home_id;
    if (filters.person_id) where.person_id = filters.person_id;
    if (filters.type) where.type = filters.type;
    if (filters.name) where.name = { [Op.iLike]: `%${filters.name}%` };
    if (filters.date) where.date = Sequelize.where(
      Sequelize.fn('DATE', Sequelize.col('date')),
      '=',
      filters.date
    );
    if (filters.next_date) where.next_date = Sequelize.where(
      Sequelize.fn('DATE', Sequelize.col('next_date')),
      '=',
      filters.next_date
    );

    return await PetTreatment.findAll({
      where,
      include: [
        {
          model: Pet,
          as: "pet",
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
      order: [["date", "DESC"]],
    });
  },

  /**
   * Buscar un tratamiento por ID con relaciones
   */
  async findById(id) {
    return await PetTreatment.findByPk(id, {
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name", "breed", "age"],
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
   * Crear un nuevo tratamiento (vacunación o desparacitación)
   */
  async create(body, t) {
    const {
      type,
      name,
      dosage,
      unit,
      date,
      next_date,
      notes,
      pet_id,
      home_id,
      person_id,
    } = body;

    try {
      const treatment = await PetTreatment.create(
        {
          type,
          name,
          dosage: type === 'deworming' ? dosage : null,
          unit: type === 'deworming' ? unit : null,
          date,
          next_date,
          notes,
          pet_id,
          home_id: home_id || null,
          person_id: person_id || null,
        },
        { transaction: t }
      );

      logger.info(`Tratamiento de mascota creado exitosamente (ID: ${treatment.id}, tipo: ${type})`);
      return treatment;
    } catch (err) {
      logger.error(`Error en PetTreatmentRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar un tratamiento existente
   */
  async update(treatment, body, t) {
    const fieldsToUpdate = [
      "type",
      "name",
      "dosage",
      "unit",
      "date",
      "next_date",
      "notes",
      "pet_id",
      "home_id",
      "person_id",
    ];

    try {
      const updatedData = Object.keys(body)
        .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
        .reduce((obj, key) => {
          // Validación lógica: si es vacunación, no debe tener dosage/unit
          if (key === 'type' && body[key] === 'vaccination') {
            obj.dosage = null;
            obj.unit = null;
          }
          obj[key] = body[key];
          return obj;
        }, {});

      // Si el tipo es "vaccination", aseguramos que dosage y unit sean null
      if (updatedData.type === 'vaccination') {
        updatedData.dosage = null;
        updatedData.unit = null;
      }

      // Actualizar solo si hay cambios
      if (Object.keys(updatedData).length > 0) {
        await treatment.update(updatedData, { transaction: t });
        logger.info(`Tratamiento actualizado (ID: ${treatment.id}, tipo: ${treatment.type})`);
      }

      return treatment;
    } catch (err) {
      logger.error(`Error en PetTreatmentRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar un tratamiento
   */
  async delete(treatment) {
    try {
      logger.info(`Tratamiento eliminado (ID: ${treatment.id}, tipo: ${treatment.type})`);
      return await treatment.destroy();
    } catch (err) {
      logger.error(`Error en PetTreatmentRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Buscar tratamientos por mascota
   */
  async findByPetId(petId) {
    return await PetTreatment.findAll({
      where: { pet_id: petId },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
    });
  },

  /**
   * Buscar tratamientos por mascota y tipo
   */
  async findByPetIdAndType(petId, type) {
    return await PetTreatment.findAll({
      where: { pet_id: petId, type },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
    });
  },

  /**
   * Buscar tratamientos por hogar
   */
  async findByHomeId(homeId) {
    return await PetTreatment.findAll({
      where: { home_id: homeId },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Person,
          as: "person",
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
    });
  },

  /**
   * Buscar tratamientos por persona (quien registró o aplicó)
   */
  async findByPersonId(personId) {
    return await PetTreatment.findAll({
      where: { person_id: personId },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name"],
        },
        {
          model: Home,
          as: "home",
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
    });
  },

  /**
   * Buscar tratamientos próximos (próximos N días)
   */
  async findUpcoming(days = 30) {
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + days);

    return await PetTreatment.findAll({
      where: {
        next_date: {
          [Op.between]: [today.toISOString().split('T')[0], nextDate.toISOString().split('T')[0]]
        },
        next_date: { [Op.not]: null }
      },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name", "breed"],
        },
        {
          model: Home,
          as: "home",
          attributes: ["id", "name"],
        },
      ],
      order: [["next_date", "ASC"]],
    });
  },

  /**
   * Buscar tratamientos atrasados (next_date < hoy)
   */
  async findOverdue() {
    const today = new Date().toISOString().split('T')[0];

    return await PetTreatment.findAll({
      where: {
        next_date: {
          [Op.lt]: today
        },
        next_date: { [Op.not]: null }
      },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name", "breed"],
        },
        {
          model: Home,
          as: "home",
          attributes: ["id", "name"],
        },
      ],
      order: [["next_date", "ASC"]],
    });
  },

  /**
   * Contar tratamientos por mascota
   */
  async countByPet(petId) {
    return await PetTreatment.count({
      where: { pet_id: petId },
    });
  },

  /**
   * Contar tratamientos próximos
   */
  async countUpcoming(days = 30) {
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + days);

    return await PetTreatment.count({
      where: {
        next_date: {
          [Op.between]: [today.toISOString().split('T')[0], nextDate.toISOString().split('T')[0]]
        },
        next_date: { [Op.not]: null }
      },
    });
  },

  /**
   * Contar por tipo (vaccination o deworming)
   */
  async countByType(type) {
    return await PetTreatment.count({
      where: { type }
    });
  },

  /**
   * Contar por mascota y tipo
   */
  async countByPetAndType(petId, type) {
    return await PetTreatment.count({
      where: { pet_id: petId, type }
    });
  }
};

module.exports = PetTreatmentRepository;