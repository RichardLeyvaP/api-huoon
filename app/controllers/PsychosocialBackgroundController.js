const { PsychosocialBackground, Person, sequelize } = require("../models");
const logger = require("../../config/logger");
const i18n = require("../../config/i18n-config");
const {
  PsychosocialBackgroundRepository,
  PersonRepository
} = require("../repositories");

const PsychosocialBackgroundController = {
  // Get all psychosocial background records
  async index(req, res) {
    logger.info(`${req.user.name} - Searching psychosocial background records`);

    try {
      const records = await PsychosocialBackgroundRepository.findAll();

      if (!records.length) {
        return res.status(204).json({ msg: "PsychosocialBackgroundsNotFound" });
      }

      // Map response
      const mappedRecords = records.map((record) => ({
        id: record.id,
        personId: record.person_id,
        person_id: record.person_id,
        date: record.date,
        occupation: record.occupation,
        educationalLevel: record.educational_level,
        educational_level: record.educational_level,
        tobaccoUse: record.tobacco_use,
        tobacco_use: record.tobacco_use,
        alcoholUse: record.alcohol_use,
        alcohol_use: record.alcohol_use,
        drugUse: record.drug_use,
        drug_use: record.drug_use,
        physicalActivity: record.physical_activity,
        physical_activity: record.physical_activity,
        familySupport: record.family_support,
        family_support: record.family_support,
        traumaticEvents: record.traumatic_events,
        traumatic_events: record.traumatic_events,
        mentalHealth: record.mental_health,
        mental_health: record.mental_health,
      }));

      res.status(200).json({ psychosocialBackgrounds: mappedRecords });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("PsychosocialBackgroundController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Get psychosocial backgrounds by person_id
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Searching psychosocial backgrounds for a person`);

    const person_id = req.person.id;

    try {
      const records = await PsychosocialBackgroundRepository.findAllByPersonId(person_id);

      if (!records.length) {
        return res.status(204).json({ msg: "PsychosocialBackgroundsNotFound" });
      }

      // Map response
      const mappedRecords = records.map((record) => ({
        id: record.id,
        personId: record.person_id,
        person_id: record.person_id,
        date: record.date,
        occupation: record.occupation,
        educationalLevel: record.educational_level,
        educational_level: record.educational_level,
        tobaccoUse: record.tobacco_use,
        tobacco_use: record.tobacco_use,
        alcoholUse: record.alcohol_use,
        alcohol_use: record.alcohol_use,
        drugUse: record.drug_use,
        drug_use: record.drug_use,
        physicalActivity: record.physical_activity,
        physical_activity: record.physical_activity,
        familySupport: record.family_support,
        family_support: record.family_support,
        traumaticEvents: record.traumatic_events,
        traumatic_events: record.traumatic_events,
        mentalHealth: record.mental_health,
        mental_health: record.mental_health,
      }));

      res.status(200).json({ psychosocialBackgrounds: mappedRecords });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("PsychosocialBackgroundController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Create a new psychosocial background record
  async store(req, res) {
    logger.info(`${req.user.name} - Creating new psychosocial background`);
    logger.debug("Received data:", req.body);

    req.body.person_id = req.person.id; // Assign authenticated person's ID

    const t = await sequelize.transaction();
    try {
      const record = await PsychosocialBackgroundRepository.create(req.body, t);
      await t.commit();
      
      res.status(201).json({ 
        psychosocialBackground: record.toJSON()
      });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("PsychosocialBackgroundController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Get a psychosocial background by ID
  async show(req, res) {
    logger.info(`${req.user.name} - Searching psychosocial background with ID ${req.body.id}`);

    try {
      const record = await PsychosocialBackgroundRepository.findById(req.body.id);

      if (!record) {
        return res.status(404).json({ msg: "PsychosocialBackgroundNotFound" });
      }

      const mappedRecord = {
        id: record.id,
        personId: record.person_id,
        person_id: record.person_id,
        date: record.date,
        occupation: record.occupation,
        educationalLevel: record.educational_level,
        educational_level: record.educational_level,
        tobaccoUse: record.tobacco_use,
        tobacco_use: record.tobacco_use,
        alcoholUse: record.alcohol_use,
        alcohol_use: record.alcohol_use,
        drugUse: record.drug_use,
        drug_use: record.drug_use,
        physicalActivity: record.physical_activity,
        physical_activity: record.physical_activity,
        familySupport: record.family_support,
        family_support: record.family_support,
        traumaticEvents: record.traumatic_events,
        traumatic_events: record.traumatic_events,
        mentalHealth: record.mental_health,
        mental_health: record.mental_health,
      };

      res.status(200).json({ psychosocialBackground: mappedRecord });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("PsychosocialBackgroundController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Update a psychosocial background record
  async update(req, res) {
    logger.info(`${req.user.name} - Updating psychosocial background with ID ${req.body.id}`);
    logger.debug("Received data:", req.body);

    try {
      const record = await PsychosocialBackgroundRepository.findById(req.body.id);

      if (!record) {
        return res.status(404).json({ msg: "PsychosocialBackgroundNotFound" });
      }

      const t = await sequelize.transaction();
      try {
        const updatedRecord = await PsychosocialBackgroundRepository.update(
          record,
          req.body,
          t
        );
        await t.commit();
        
        res.status(200).json({ psychosocialBackground: updatedRecord });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("PsychosocialBackgroundController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Delete a psychosocial background record
  async destroy(req, res) {
    logger.info(`${req.user.name} - Deleting psychosocial background with ID ${req.body.id}`);

    try {
      const record = await PsychosocialBackgroundRepository.findById(req.body.id);

      if (!record) {
        return res.status(404).json({ msg: "PsychosocialBackgroundNotFound" });
      }

      await PsychosocialBackgroundRepository.delete(record);

      res.status(200).json({ msg: "PsychosocialBackgroundDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("PsychosocialBackgroundController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Get the last psychosocial background for a person
  async getLastByPersonId(req, res) {
    logger.info(`${req.user.name} - Searching last psychosocial background for person`);

    try {
      const lastRecord = await PsychosocialBackgroundRepository.getLastByPersonId(req.person.id);

      if (!lastRecord) {
        return res.status(204).json({ msg: "PsychosocialBackgroundNotFound" });
      }

      res.status(200).json({ lastPsychosocialBackground: lastRecord });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("PsychosocialBackgroundController->getLastByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  }
};

module.exports = PsychosocialBackgroundController;