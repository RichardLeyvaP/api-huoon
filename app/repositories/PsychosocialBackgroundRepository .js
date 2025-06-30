const { PsychosocialBackground, Person, sequelize } = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");

const PsychosocialBackgroundRepository = {
  async findAll() {
    return await PsychosocialBackground.findAll({
      attributes: [
        "id",
        "person_id",
        "date",
        "occupation",
        "educational_level",
        "tobacco_use",
        "alcohol_use",
        "drug_use",
        "physical_activity",
        "family_support",
        "traumatic_events",
        "mental_health"
      ],
      include: [
        {
          model: Person,
          as: "person"
        }
      ],
      order: [['date', 'DESC']]
    });
  },

  async findAllByPersonId(person_id) {
    return await PsychosocialBackground.findAll({
      where: { person_id },
      attributes: [
        "id",
        "date",
        "occupation",
        "educational_level",
        "tobacco_use",
        "alcohol_use",
        "drug_use",
        "physical_activity",
        "family_support",
        "traumatic_events",
        "mental_health"
      ],
      order: [['date', 'DESC']]
    });
  },

  async findById(id) {
    return await PsychosocialBackground.findByPk(id, {
      attributes: [
        "id",
        "person_id",
        "date",
        "occupation",
        "educational_level",
        "tobacco_use",
        "alcohol_use",
        "drug_use",
        "physical_activity",
        "family_support",
        "traumatic_events",
        "mental_health"
      ],
      include: [
        {
          model: Person,
          as: "person"
        }
      ]
    });
  },

  async create(body, t) {
    try {
      const newRecord = await PsychosocialBackground.create(
        {
          person_id: body.person_id,
          date: body.date,
          occupation: body.occupation || null,
          educational_level: body.educational_level || null,
          tobacco_use: body.tobacco_use || null,
          alcohol_use: body.alcohol_use || null,
          drug_use: body.drug_use || null,
          physical_activity: body.physical_activity || null,
          family_support: body.family_support || null,
          traumatic_events: body.traumatic_events || null,
          mental_health: body.mental_health || null
        },
        { transaction: t }
      );

      return newRecord;
    } catch (err) {
      logger.error(`Error en PsychosocialBackgroundRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(record, body, t) {
    const fieldsToUpdate = [
      "date",
      "occupation",
      "educational_level",
      "tobacco_use",
      "alcohol_use",
      "drug_use",
      "physical_activity",
      "family_support",
      "traumatic_events",
      "mental_health"
    ];
    const updatedData = {};

    try {
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      if (Object.keys(updatedData).length > 0) {
        await record.update(updatedData, { transaction: t });
        logger.info(`Antecedente psicosocial actualizado exitosamente (ID: ${record.id})`);
      }

      return record;
    } catch (err) {
      logger.error(`Error en PsychosocialBackgroundRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(record) {
    try {
      return await record.destroy();
    } catch (err) {
      logger.error(`Error en PsychosocialBackgroundRepository->delete: ${err.message}`);
      throw err;
    }
  },

  async getLastByPersonId(person_id) {
    return await PsychosocialBackground.findOne({
      where: { person_id },
      order: [['date', 'DESC']],
      attributes: [
        "date",
        "tobacco_use",
        "alcohol_use",
        "drug_use",
        "physical_activity",
        "family_support"
      ]
    });
  }
};

module.exports = PsychosocialBackgroundRepository;