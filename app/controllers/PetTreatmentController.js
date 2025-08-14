const logger = require("../../config/logger");
const { 
  PetTreatmentRepository, 
  PetRepository, 
  HomeRepository, 
  PersonRepository 
} = require("../repositories");
const i18n = require("../../config/i18n-config");
const { sequelize } = require("../models");

const PetTreatmentController = {
  /**
   * Obtener todos los tratamientos (vacunaciones y desparacitaciones)
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todos los tratamientos de mascotas`);
    try {
      const treatments = await PetTreatmentRepository.findAll();

      if (!treatments.length) {
        return res.status(204).json({ msg: "TreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        dosage: t.dosage,
        unit: t.unit,
        date: t.date,
        nextDate: t.next_date,
        notes: t.notes,
        petId: t.pet_id,
        pet_id: t.pet_id,
        petName: t.pet?.name || null,
        homeId: t.home_id,
        home_id: t.home_id,
        homeName: t.home?.name || null,
        personId: t.person_id,
        person_id: t.person_id,
        personName: t.person?.name || null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PetTreatmentController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener un tratamiento por ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca un tratamiento de mascota por ID`);
    try {
      const { id } = req.body;

      const treatment = await PetTreatmentRepository.findById(id);

      if (!treatment) {
        return res.status(204).json({ msg: "TreatmentNotFound" });
      }

      const mappedTreatment = {
        id: treatment.id,
        type: treatment.type,
       name: treatment.name,
        dosage: treatment.dosage,
        unit: treatment.unit,
        date: treatment.date,
        nextDate: treatment.next_date,
        notes: treatment.notes,
        petId: treatment.pet_id,
        pet_id: treatment.pet_id,
        petName: treatment.pet?.name || null,
        homeId: treatment.home_id,
        home_id: treatment.home_id,
        homeName: treatment.home?.name || null,
        personId: treatment.person_id,
        person_id: treatment.person_id,
        personName: treatment.person?.name || null,
        createdAt: treatment.createdAt,
        updatedAt: treatment.updatedAt,
      };

      return res.status(200).json({ treatment: mappedTreatment });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener tratamientos por mascota
   */
  async getByPetId(req, res) {
    logger.info(`${req.user.name} - Busca tratamientos por mascota`);
    try {
      const { pet_id } = req.body;

      // Validar que la mascota exista
      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        return res.status(404).json({ msg: "PetNotFound" });
      }

      const treatments = await PetTreatmentRepository.findByPetId(pet_id);

      if (!treatments.length) {
        return res.status(204).json({ msg: "TreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        date: t.date,
        nextDate: t.next_date,
        next_date: t.next_date,
        notes: t.notes,
        dosage: t.dosage,
        unit: t.unit,
        personId: t.person_id,
        person_id: t.person_id,
        homeId: t.home_id,
        home_id: t.home_id,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->getByPetId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener tratamientos por tipo y mascota (opcional)
   */
  async getByPetIdAndType(req, res) {
    logger.info(`${req.user.name} - Busca tratamientos por mascota y tipo`);
    try {
      const { pet_id, type } = req.body;

      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        return res.status(404).json({ msg: "PetNotFound" });
      }

      const treatments = await PetTreatmentRepository.findByPetIdAndType(pet_id, type);

      const mappedTreatments = treatments.map((t) => ({
        id: t.id,
        name: t.name,
        date: t.date,
        nextDate: t.next_date,
        next_date: t.next_date,
        notes: t.notes,
        dosage: t.dosage,
        unit: t.unit,
        personId: t.person_id,
        person_id: t.person_id,
        homeId: t.home_id,
        home_id: t.home_id,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->getByPetIdAndType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener tratamientos por hogar
   */
  async getByHomeId(req, res) {
    logger.info(`${req.user.name} - Busca tratamientos por hogar`);
    try {
      const { homeId } = req.params;

      const home = await HomeRepository.findById(homeId);
      if (!home) {
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      const treatments = await PetTreatmentRepository.findByHomeId(homeId);

      if (!treatments.length) {
        return res.status(204).json({ msg: "TreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        date: t.date,
        nextDate: t.next_date,
        next_date: t.next_date,
        notes: t.notes,
        petId: t.pet_id,
        pet_id: t.pet_id,
        petName: t.pet?.name || null,
        personId: t.person_id,
        person_id: t.person_id,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->getByHomeId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener tratamientos por persona (quien registró/aplicó)
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca tratamientos por persona`);
    try {
      const { personId } = req.params;

      const person = await PersonRepository.findById(personId);
      if (!person) {
        return res.status(404).json({ msg: "PersonNotFound" });
      }

      const treatments = await PetTreatmentRepository.findByPersonId(personId);

      if (!treatments.length) {
        return res.status(204).json({ msg: "TreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        date: t.date,
        nextDate: t.next_date,
        notes: t.notes,
        petId: t.pet_id,
        petName: t.pet?.name || null,
        homeId: t.home_id,
        homeName: t.home?.name || null,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener tratamientos próximos (próximos N días)
   */
  async getUpcoming(req, res) {
    logger.info(`${req.user.name} - Busca tratamientos próximos`);
    try {
      const days = parseInt(req.query.days) || 30;
      const treatments = await PetTreatmentRepository.findUpcoming(days);

      if (!treatments.length) {
        return res.status(204).json({ msg: "UpcomingTreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        date: t.date,
        nextDate: t.next_date,
        notes: t.notes,
        petId: t.pet_id,
        petName: t.pet?.name || null,
        homeId: t.home_id,
        homeName: t.home?.name || null,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->getUpcoming: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener tratamientos atrasados
   */
  async getOverdue(req, res) {
    logger.info(`${req.user.name} - Busca tratamientos atrasados`);
    try {
      const treatments = await PetTreatmentRepository.findOverdue();

      if (!treatments.length) {
        return res.status(204).json({ msg: "OverdueTreatmentsNotFound", treatments: [] });
      }

      const mappedTreatments = treatments.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        date: t.date,
        nextDate: t.next_date,
        notes: t.notes,
        petId: t.pet_id,
        petName: t.pet?.name || null,
        homeId: t.home_id,
        homeName: t.home?.name || null,
      }));

      return res.status(200).json({ treatments: mappedTreatments });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->getOverdue: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear un nuevo tratamiento (vacunación o desparacitación)
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo tratamiento para mascota`);
    logger.info("Datos recibidos:", JSON.stringify(req.body));

    req.body.person_id = req.person.id; // Quien registra
    const transaction = await sequelize.transaction();
    try {
       const { pet_id, home_id } = req.body;

      // Validar mascota
      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        await transaction.rollback();
        logger.error(`Mascota no encontrada con ID ${pet_id}`);
        return res.status(404).json({ msg: "PetNotFound" });
      }

      // Validar hogar si se proporciona
      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          logger.error(`Hogar no encontrado con ID ${home_id}`);
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      // Crear tratamiento
      const treatment = await PetTreatmentRepository.create(req.body, transaction);
      await transaction.commit();

      res.status(201).json({ treatment });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar un tratamiento existente
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza tratamiento con ID ${req.body.id}`);
    logger.info("Datos recibidos:", JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {
      const { id, pet_id, home_id } = req.body;

      const treatment = await PetTreatmentRepository.findById(id);
      if (!treatment) {
        return res.status(404).json({ msg: "TreatmentNotFound" });
      }

      // Validar mascota si se actualiza
      if (pet_id) {
        const pet = await PetRepository.findById(pet_id);
        if (!pet) {
          await transaction.rollback();
          return res.status(404).json({ msg: "PetNotFound" });
        }
      }

      // Validar hogar
      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      // Actualizar
      const updatedTreatment = await PetTreatmentRepository.update(treatment, req.body, transaction);
      await transaction.commit();

      res.status(200).json({ treatment: updatedTreatment });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar un tratamiento
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina tratamiento con ID ${req.body.id}`);

    const { id } = req.body;
    const transaction = await sequelize.transaction();

    try {

      const treatment = await PetTreatmentRepository.findById(id);
      if (!treatment) {
        return res.status(404).json({ msg: "TreatmentNotFound" });
      }

      await PetTreatmentRepository.delete(treatment, transaction);
      await transaction.commit();

      res.status(200).json({ msg: "TreatmentDeleted" });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetTreatmentController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Opciones para formulario: mascotas, hogares, personas
   */
  async formOptions(req, res) {
    logger.info(`${req.user.name} - Solicita opciones para formulario de tratamientos`);

    try {
      // Mascotas
      const pets = await PetRepository.findAll();
      const formattedPets = pets.map(p => ({
        id: p.id,
        name: p.name,
        breed: p.breed,
        age: p.age,
        typeName: i18n.__(`typetask.${p.type}.name`) !== `typetask.${p.type}.name`
          ? i18n.__(`typetask.${p.type}.name`)
          : p.type,
        homeName: p.home?.name || null,
        personName: p.person?.name || null,
      }));

      // Hogares
      const homes = await HomeRepository.findAll();
      const formattedHomes = homes.map(h => ({
        id: h.id,
        name: h.name,
        address: h.address,
      }));

      // Personas
      const persons = await PersonRepository.findAll();
      const formattedPersons = persons.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
      }));

      // Tipos de tratamiento
      const treatmentTypes = [
        { id: 'vaccination', name: 'Vacunación' },
        { id: 'deworming', name: 'Desparacitación' }
      ];

      const translatedTypes = treatmentTypes.map(t => ({
        id: t.id,
        name: i18n.__(`treatmentType.${t.id}.name`) !== `treatmentType.${t.id}.name`
          ? i18n.__(`treatmentType.${t.id}.name`)
          : t.name
      }));

      // Unidades comunes
      const units = ['mg', 'ml', 'g', 'gr', 'kg', 'l'].map(u => ({
        id: u,
        name: u
      }));

      return res.status(200).json({
        pets: formattedPets,
        homes: formattedHomes,
        persons: formattedPersons,
        types: translatedTypes,
        units
      });
    } catch (error) {
      logger.error("PetTreatmentController->formOptions: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },
};

module.exports = PetTreatmentController;