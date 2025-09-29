const { Op } = require("sequelize");
const { PersonalBackground, Person, Type, Home, sequelize } = require("../models");
const logger = require("../../config/logger");

const PersonalBackgroundRepository = {
  /**
   * Obtener todos los antecedentes personales.
   */
  async findAll() {
    return await PersonalBackground.findAll({
      include: [
        { model: Person, as: "person" },
        { model: Type, as: "type" },
      ],
      order: [['startDate', 'DESC']] // Ordenar por fecha de inicio descendente
    });
  },

  /**
   * Obtener todos los antecedentes personales de una persona específica.
   * @param {number} personId - ID de la persona.
   */
  async findAllByPersonId(personId) {
    return await PersonalBackground.findAll({
      where: { person_id: personId,  },
      include: [
        { model: Person, as: "person" },
        { model: Type, as: "type" },
      ],
      order: [['startDate', 'DESC']]
    });
  },

  async findByPersonIdType(personId, type) {
  
    return await PersonalBackground.findAll({
      where: { 
        person_id: personId,
        typeDetail: type
      },
      include: [
        { model: Person, as: "person" },
        { model: Type, as: "type" },
      ],
      order: [['startDate', 'DESC']]
    });
  },

  /**
   * Obtener un antecedente personal por su ID.
   * @param {number} id - ID del antecedente.
   */
  async findById(id) {
    return await PersonalBackground.findByPk(id, {
      include: [
        { model: Person, as: "person" },
        { model: Type, as: "type" },
      ]
    });
  },

  /**
   * Crear un nuevo antecedente personal.
   * @param {object} body - Datos del antecedente.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async create(body, t = null) {
    try {
      const background = await PersonalBackground.create(
        {
          person_id: body.person_id,
          type_id: body.type_id,
          description: body.description,
          details: body.details,
          startDate: body.startDate,
          endDate: body.endDate,
          status: body.status || 'Activo', // Valor por defecto
          severity: body.severity,
          typeDetail: body.typeDetail || 'Antecedente'
        },
        { transaction: t }
      );
      return background;
    } catch (err) {
      logger.error(`Error en PersonalBackgroundRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar un antecedente personal existente.
   * @param {object} background - Instancia del antecedente.
   * @param {object} body - Datos actualizados.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async update(background, body, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "type_id",
      "description",
      "details",
      "startDate",
      "endDate",
      "status",
      "severity",
      "typeDetail"
    ];

    try {
      // Filtrar campos en body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Actualizar solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await background.update(updatedData, { transaction: t });
        logger.info(
          `Antecedente personal actualizado exitosamente (ID: ${background.id})`
        );
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en PersonalBackgroundRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar un antecedente personal.
   * @param {object} background - Instancia del antecedente.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async delete(background, t = null) {
    try {
      await background.destroy({ transaction: t });
      logger.info(
        `Antecedente personal eliminado exitosamente (ID: ${background.id})`
      );
    } catch (err) {
      logger.error(`Error en PersonalBackgroundRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Obtener antecedentes personales por tipo
   * @param {number} typeId - ID del tipo de antecedente
   * @param {number} personId - ID de la persona (opcional)
   */
  async findByType(typeId, personId = null, type = null) {
    const where = { type_id: typeId };
    if (personId) {
      where.person_id = personId;
    }

    if (type !== null && type !== undefined) {
      where.typeDetail == type;
    }

    return await PersonalBackground.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Type, as: "type" },
      ],
      order: [['startDate', 'DESC']]
    });
  },

  /**
   * Obtener antecedentes personales activos
   * @param {number} personId - ID de la persona (opcional)
   */
  async findActive(personId = null) {
    const where = { status: 'active' };
    if (personId) {
      where.person_id = personId;
    }

    return await PersonalBackground.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Type, as: "type" },
      ],
      order: [['startDate', 'DESC']]
    });
  },

  async findHouseholdVaccinationStatus(homeId, personId = null) {
  try {
    const whereHome = { id: homeId };
    const wherePerson = personId ? { id: personId } : {};
    // Buscar todos los miembros del hogar con sus antecedentes de tipo "Vacunación"
    const householdMembers = await Person.findAll({
      where: wherePerson,
      include: [
        {
          model: PersonalBackground,
          as: 'personalBackgrounds',
          where: {typeDetail: 'Vacunacion'},
          include: [
            {
              model: Type,
              as: 'type',
            },
          ],
          required: false,
          order: [['startDate', 'DESC']],
        },
        {
          model: Home,
          as: 'homePersons',
          where: { id: homeId },
          required: true,
        },
      ],
      distinct: true,
    });

    return householdMembers;

  } catch (error) {
    logger.error('PersonalBackgroundRepository->findHouseholdVaccinationStatus:', error.message);
    throw new Error(`Error fetching household vaccination status: ${error.message}`);
  }
}
};

module.exports = PersonalBackgroundRepository;