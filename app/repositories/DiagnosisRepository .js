const { Diagnosis, Person, MedicalConsultation, Type, sequelize } = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");

const DiagnosisRepository = {
  async findAll() {
    return await Diagnosis.findAll({
      attributes: [
        "id",
        "person_id",
        "medical_consultation_id",
        "type_id",
        "date",
        "description",
        "cie10_code",
        "notes"
      ],
      include: [
        { 
          model: MedicalConsultation, 
          as: "medicalConsultation" 
        },
        {
          model: Person,
          as: "person"
        },
        {
          model: Type,
          as: "type"
        }
      ],
      order: [['date', 'DESC']]
    });
  },

  async findAllByPersonId(person_id) {
    return await Diagnosis.findAll({
      where: { person_id },
      attributes: [
        "id",
        "medical_consultation_id",
        "type_id",
        "date",
        "description",
        "cie10_code",
        "notes"
      ],
      include: [
        { 
          model: MedicalConsultation, 
          as: "medicalConsultation" 
        },
        {
          model: Type,
          as: "type"
        }
      ],
      order: [['date', 'DESC']]
    });
  },

  async findById(id) {
    return await Diagnosis.findByPk(id, {
      attributes: [
        "id",
        "person_id",
        "medical_consultation_id",
        "type_id",
        "date",
        "description",
        "cie10_code",
        "notes"
      ],
      include: [
        { 
          model: MedicalConsultation, 
          as: "medicalConsultation" 
        },
        {
          model: Person,
          as: "person"
        },
        {
          model: Type,
          as: "type"
        }
      ]
    });
  },

  async create(body, t) {
    try {
      const newDiagnosis = await Diagnosis.create(
        {
          person_id: body.person_id,
          medical_consultation_id: body.medical_consultation_id || null,
          type_id: body.type_id || null,
          date: body.date || new Date(),
          description: body.description,
          cie10_code: body.cie10_code || null,
          notes: body.notes || null
        },
        { transaction: t }
      );

      return newDiagnosis;
    } catch (err) {
      logger.error(`Error en DiagnosisRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(diagnosisRecord, body, t) {
    const fieldsToUpdate = [
      "medical_consultation_id",
      "type_id",
      "date",
      "description",
      "cie10_code",
      "notes"
    ];
    const updatedData = {};

    try {
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      if (Object.keys(updatedData).length > 0) {
        await diagnosisRecord.update(updatedData, { transaction: t });
        logger.info(`Diagnóstico actualizado exitosamente (ID: ${diagnosisRecord.id})`);
      }

      return diagnosisRecord;
    } catch (err) {
      logger.error(`Error en DiagnosisRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(diagnosisRecord) {
    try {
      return await diagnosisRecord.destroy();
    } catch (err) {
      logger.error(`Error en DiagnosisRepository->delete: ${err.message}`);
      throw err;
    }
  },

  async getLastByPersonId(person_id) {
    return await Diagnosis.findOne({
      where: { person_id },
      order: [['date', 'DESC']],
      attributes: [
        "date",
        "description",
        "cie10_code",
        "type_id",
        "medical_consultation_id"
      ],
      include: [
        {
          model: Type,
          as: "type"
        }
      ]
    });
  }
};

module.exports = DiagnosisRepository;