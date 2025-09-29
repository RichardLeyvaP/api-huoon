// repositories/vetVisit.repository.js
const { Op, Sequelize } = require("sequelize");
const { VetVisit, Pet, Home, Person } = require("../models");
const logger = require("../../config/logger");
const ImageService = require("../services/ImageService");

const VetVisitRepository = {
  /**
   * Obtener todas las visitas con relaciones
   */
  async findAll() {
    return await VetVisit.findAll({
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
   * Buscar visitas por filtros
   */
  async findByFilters(filters) {
    const where = {};

    if (filters.pet_id) where.pet_id = filters.pet_id;
    if (filters.home_id) where.home_id = filters.home_id;
    if (filters.person_id) where.person_id = filters.person_id;
    if (filters.vet_name) where.vet_name = { [Op.iLike]: `%${filters.vet_name}%` };
    if (filters.clinic) where.clinic = { [Op.iLike]: `%${filters.clinic}%` };
    if (filters.diagnosis) where.diagnosis = { [Op.iLike]: `%${filters.diagnosis}%` };
    if (filters.date) where.date = Sequelize.where(
      Sequelize.fn('DATE', Sequelize.col('date')),
      '=',
      filters.date
    );
    if (filters.next_visit) where.next_visit = Sequelize.where(
      Sequelize.fn('DATE', Sequelize.col('next_visit')),
      '=',
      filters.next_visit
    );

    return await VetVisit.findAll({
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
   * Buscar una visita por ID
   */
  async findById(id) {
    return await VetVisit.findByPk(id, {
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
   * Crear una nueva visita
   */
  async create(body, file, t) {
    const {
      pet_id,
      date,
      vet_name,
      clinic,
      reason,
      diagnosis,
      treatment_given,
      recommendations,
      next_visit,
      home_id,
      person_id,
      image,
    } = body;

    try {
      const visit = await VetVisit.create(
        {
          pet_id,
          date,
          vet_name,
          clinic,
          reason,
          diagnosis,
          treatment_given,
          recommendations,
          next_visit,
          home_id: home_id || null,
          person_id: person_id || null,
          image: image || null,
        },
        { transaction: t }
      );
       if (file) {
        const newFilename = ImageService.generateFilename(
          "vetvisits",
          visit.id,
          file.originalname
        );
        const imagePath = await ImageService.moveFile(file, newFilename);
        await visit.update({ image: imagePath }, { transaction: t });
      }
      logger.info(`Consulta veterinaria creada (ID: ${visit.id})`);
      return visit;
    } catch (err) {
      logger.error(`Error en VetVisitRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar una visita existente
   */
  async update(visit, body, file, t) {
    const fieldsToUpdate = [
      "pet_id",
      "date",
      "vet_name",
      "clinic",
      "reason",
      "diagnosis",
      "treatment_given",
      "recommendations",
      "next_visit",
      "home_id",
      "person_id",
      "image",
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
          visit.image &&
          visit.image !== "vetvisits/default.jpg"
        ) {
          await ImageService.deleteFile(visit.image);
        }

        const newFilename = ImageService.generateFilename(
          "vetvisits",
          visit.id,
          file.originalname
        );
        updatedData.image = await ImageService.moveFile(file, newFilename);
      }

      if (Object.keys(updatedData).length > 0) {
        await visit.update(updatedData, { transaction: t });
        logger.info(`Consulta veterinaria actualizada (ID: ${visit.id})`);
      }

      return visit;
    } catch (err) {
      logger.error(`Error en VetVisitRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar una visita
   */
  async delete(visit) {
    try {
      logger.info(`Consulta veterinaria eliminada (ID: ${visit.id})`);
       if (visit.image && visit.image !== "pets/default.jpg") {
        await ImageService.deleteFile(visit.image);
      }
      return await visit.destroy();
    } catch (err) {
      logger.error(`Error en VetVisitRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Buscar visitas por mascota
   */
  async findByPetId(petId) {
    return await VetVisit.findAll({
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

  getWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Domingo) - 6 (Sábado)
    // Ajustamos para que Lunes = 0, Domingo = 6
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo, restamos 6 días para llegar a lunes

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Formateamos a YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startOfWeek: formatDate(startOfWeek),
      endOfWeek: formatDate(endOfWeek)
    };
  },

  async countPetsWithUpcomingVetVisits(petIds) {
  const { startOfWeek, endOfWeek } = this.getWeekRange();

  const result = await VetVisit.findAll({
    where: {
      pet_id: petIds,
      next_visit: {
        [Op.gte]: startOfWeek,
        [Op.lte]: endOfWeek
      }
    },
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('pet_id')), 'pet_id']],
    raw: true
  });

  return result.length;
},

async getUpcomingVetVisitDetailsForPets(petIds) {
  const { startOfWeek, endOfWeek } = this.getWeekRange();

  const records = await VetVisit.findAll({
    where: {
      pet_id: petIds,
      next_visit: {
        [Op.gte]: startOfWeek,
        [Op.lte]: endOfWeek
      }
    },
    attributes: ['id', 'pet_id', 'vet_name', 'date', 'next_visit', 'clinic', 'reason'],
    raw: true
  });

  // Renombrar next_visit → next_date para consistencia si quieres
  return records.map(r => ({
    ...r,
    next_date: r.next_visit
  }));
},

  /**
   * Buscar visitas próximas
   */
  async findUpcoming(days = 30) {
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + days);

    return await VetVisit.findAll({
      where: {
        next_visit: {
          [Op.between]: [today.toISOString().split('T')[0], nextDate.toISOString().split('T')[0]]
        },
        next_visit: { [Op.not]: null }
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
      order: [["next_visit", "ASC"]],
    });
  },

  /**
   * Buscar visitas atrasadas
   */
  async findOverdue() {
    const today = new Date().toISOString().split('T')[0];

    return await VetVisit.findAll({
      where: {
        next_visit: {
          [Op.lt]: today
        },
        next_visit: { [Op.not]: null }
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
      order: [["next_visit", "ASC"]],
    });
  },
};

module.exports = VetVisitRepository;