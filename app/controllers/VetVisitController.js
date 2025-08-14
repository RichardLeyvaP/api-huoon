// controllers/vetVisit.controller.js
const logger = require("../../config/logger");
const { 
  VetVisitRepository, 
  PetRepository, 
  HomeRepository, 
  PersonRepository 
} = require("../repositories");
const i18n = require("../../config/i18n-config");
const { sequelize } = require("../models");

const VetVisitController = {
  /**
   * Obtener todas las visitas veterinarias
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todas las visitas veterinarias`);
    try {
      const visits = await VetVisitRepository.findAll();

      if (!visits.length) {
        return res.status(204).json({ msg: "VetVisitsNotFound", visits: [] });
      }

      const mappedVisits = visits.map((v) => ({
        id: v.id,
        pet_id: v.pet_id,
        petName: v.pet?.name || null,
        date: v.date,
        vet_name: v.vet_name,
        clinic: v.clinic,
        reason: v.reason,
        diagnosis: v.diagnosis,
        treatment_given: v.treatment_given,
        recommendations: v.recommendations,
        next_visit: v.next_visit,
        home_id: v.home_id,
        person_id: v.person_id,
        image: v.image,
      }));

      return res.status(200).json({ visits: mappedVisits });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((d) => d.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("VetVisitController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener una visita por ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca una visita veterinaria por ID`);
    try {
      const { id } = req.params;

      const { error } = idVetVisitSchema.validate({ id });
      if (error) {
        return res.status(400).json({
          error: "ValidationError",
          details: error.details.map(d => d.message)
        });
      }

      const visit = await VetVisitRepository.findById(id);

      if (!visit) {
        return res.status(204).json({ msg: "VetVisitNotFound" });
      }

      const mappedVisit = {
        id: visit.id,
        pet_id: visit.pet_id,
        petName: visit.pet?.name || null,
        date: visit.date,
        vet_name: visit.vet_name,
        clinic: visit.clinic,
        reason: visit.reason,
        diagnosis: visit.diagnosis,
        treatment_given: visit.treatment_given,
        recommendations: visit.recommendations,
        next_visit: visit.next_visit,
        home_id: visit.home_id,
        person_id: visit.person_id,
        personName: visit.person?.name || null,
        image: visit.image,
      };

      return res.status(200).json({ visit: mappedVisit });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("VetVisitController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener visitas por mascota
   */
  async getByPetId(req, res) {
    logger.info(`${req.user.name} - Busca visitas por mascota`);
    try {
      const { pet_id } = req.body;

      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        return res.status(404).json({ msg: "PetNotFound" });
      }

      const visits = await VetVisitRepository.findByPetId(pet_id);

      if (!visits.length) {
        return res.status(204).json({ msg: "VetVisitsNotFound", visits: [] });
      }

      const mappedVisits = visits.map(v => ({
        id: v.id,
        date: v.date,
        vet_name: v.vet_name,
        clinic: v.clinic,
        diagnosis: v.diagnosis,
        reason: v.reason,
        treatment_given: v.treatment_given,
        recommendations: v.recommendations,
        next_visit: v.next_visit,
        person_id: v.person_id,
        home_id: v.home_id,
        image: v.image,
      }));

      return res.status(200).json({ visits: mappedVisits });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("VetVisitController->getByPetId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener visitas próximas
   */
  async getUpcoming(req, res) {
    logger.info(`${req.user.name} - Busca visitas veterinarias próximas`);
    try {
      const days = parseInt(req.query.days) || 30;
      const visits = await VetVisitRepository.findUpcoming(days);

      if (!visits.length) {
        return res.status(204).json({ msg: "UpcomingVetVisitsNotFound", visits: [] });
      }

      const mappedVisits = visits.map(v => ({
        id: v.id,
        pet_id: v.pet_id,
        petName: v.pet?.name || null,
        date: v.date,
        vet_name: v.vet_name,
        next_visit: v.next_visit,
        clinic: v.clinic,
        diagnosis: v.diagnosis,
      }));

      return res.status(200).json({ visits: mappedVisits });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("VetVisitController->getUpcoming: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener visitas atrasadas
   */
  async getOverdue(req, res) {
    logger.info(`${req.user.name} - Busca visitas veterinarias atrasadas`);
    try {
      const visits = await VetVisitRepository.findOverdue();

      if (!visits.length) {
        return res.status(204).json({ msg: "OverdueVetVisitsNotFound", visits: [] });
      }

      const mappedVisits = visits.map(v => ({
        id: v.id,
        pet_id: v.pet_id,
        petName: v.pet?.name || null,
        date: v.date,
        vet_name: v.vet_name,
        next_visit: v.next_visit,
        clinic: v.clinic,
        diagnosis: v.diagnosis,
      }));

      return res.status(200).json({ visits: mappedVisits });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("VetVisitController->getOverdue: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear una nueva visita
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva visita veterinaria`);
    logger.info("Datos recibidos al crear una visita veterinaria:");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {
        req.body.person_id = req.person.id;
      const { pet_id, home_id } = req.body;

      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        await transaction.rollback();
        return res.status(404).json({ msg: "PetNotFound" });
      }

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      const visit = await VetVisitRepository.create(req.body, req.file, transaction);
      await transaction.commit();

      res.status(201).json({ visit });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("VetVisitController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar una visita
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza visita veterinaria con ID ${req.body.id}`);
   logger.info("Datos recibidos al editar una visita veterinaria:");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {
      const { id, pet_id, home_id } = req.body;

      const visit = await VetVisitRepository.findById(id);
      if (!visit) {
        return res.status(404).json({ msg: "VetVisitNotFound" });
      }

      if (pet_id) {
        const pet = await PetRepository.findById(pet_id);
        if (!pet) {
          await transaction.rollback();
          return res.status(404).json({ msg: "PetNotFound" });
        }
      }

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      const updatedVisit = await VetVisitRepository.update(visit, req.body, req.file, transaction);
      await transaction.commit();

      res.status(200).json({ visit: updatedVisit });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("VetVisitController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar una visita
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina visita veterinaria con ID ${req.body.id}`);

    const { id } = req.body;
    const transaction = await sequelize.transaction();

    try {

      const visit = await VetVisitRepository.findById(id);
      if (!visit) {
        return res.status(404).json({ msg: "VetVisitNotFound" });
      }

      await VetVisitRepository.delete(visit, transaction);
      await transaction.commit();

      res.status(200).json({ msg: "VetVisitDeleted" });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("VetVisitController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Opciones para formulario
   */
  async formOptions(req, res) {
    logger.info(`${req.user.name} - Solicita opciones para formulario de visitas`);

    try {
      const pets = await PetRepository.findAll();
      const homes = await HomeRepository.findAll();
      const persons = await PersonRepository.findAll();

      return res.status(200).json({
        pets: pets.map(p => ({ id: p.id, name: p.name })),
        homes: homes.map(h => ({ id: h.id, name: h.name })),
        persons: persons.map(p => ({ id: p.id, name: p.name, email: p.email }))
      });
    } catch (error) {
      logger.error("VetVisitController->formOptions: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  }
};

module.exports = VetVisitController;