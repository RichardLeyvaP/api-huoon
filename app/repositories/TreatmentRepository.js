const { Treatment, Person, MedicalConsultation, sequelize } = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");

const TreatmentRepository = {
  async findAll() {
    return await Treatment.findAll({
      attributes: [
        "id",
        "person_id",
        "medical_consultation_id",
        "medication",
        "dosage",
        "frequency",
        "duration",
        "instructions",
        "purpose",
        "startDate",
        "endDate"
      ],
      include: [
        { 
          model: MedicalConsultation, 
          as: "medicalConsultation" 
        },
        {
          model: Person,
          as: "person"
        }
      ],
      order: [['startDate', 'DESC']]
    });
  },

  async findAllByPersonId(person_id) {
    return await Treatment.findAll({
      where: { person_id },
      attributes: [
        "id",
        "medical_consultation_id",
        "medication",
        "dosage",
        "frequency",
        "duration",
        "instructions",
        "purpose",
        "startDate",
        "endDate"
      ],
      include: [
        { 
          model: MedicalConsultation, 
          as: "medicalConsultation" 
        }
      ],
      order: [['startDate', 'DESC']]
    });
  },

  async findById(id) {
    return await Treatment.findByPk(id, {
      attributes: [
        "id",
        "person_id",
        "medical_consultation_id",
        "medication",
        "dosage",
        "frequency",
        "duration",
        "instructions",
        "purpose",
        "startDate",
        "endDate"
      ],
      include: [
        { 
          model: MedicalConsultation, 
          as: "medicalConsultation" 
        },
        {
          model: Person,
          as: "person"
        }
      ]
    });
  },

  async create(body, t) {
    try {
      const newTreatment = await Treatment.create(
        {
          person_id: body.person_id,
          medical_consultation_id: body.medical_consultation_id || null,
          medication: body.medication || null,
          dosage: body.dosage || null,
          frequency: body.frequency || null,
          duration: body.duration || null,
          instructions: body.instructions || null,
          purpose: body.purpose || null,
          startDate: body.startDate || null,
          endDate: body.endDate || null
        },
        { transaction: t }
      );

      return newTreatment;
    } catch (err) {
      logger.error(`Error en TreatmentRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(treatmentRecord, body, t) {
    const fieldsToUpdate = [
      "medical_consultation_id",
      "medication",
      "dosage",
      "frequency",
      "duration",
      "instructions",
      "purpose",
      "startDate",
      "endDate"
    ];
    const updatedData = {};

    try {
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      if (Object.keys(updatedData).length > 0) {
        await treatmentRecord.update(updatedData, { transaction: t });
        logger.info(`Tratamiento actualizado exitosamente (ID: ${treatmentRecord.id})`);
      }

      return treatmentRecord;
    } catch (err) {
      logger.error(`Error en TreatmentRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(treatmentRecord) {
    try {
      return await treatmentRecord.destroy();
    } catch (err) {
      logger.error(`Error en TreatmentRepository->delete: ${err.message}`);
      throw err;
    }
  },

  async getLastByPersonId(person_id) {
    return await Treatment.findOne({
      where: { person_id },
      order: [['startDate', 'DESC']],
      attributes: [
        "medication",
        "dosage",
        "frequency",
        "startDate",
        "endDate"
      ]
    });
  },

  async getActiveTreatments(person_id) {
    return await Treatment.findAll({
      where: { 
        person_id,
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: new Date() } }
        ]
      },
      order: [['startDate', 'DESC']],
      attributes: [
        "id",
        "medication",
        "dosage",
        "frequency",
        "startDate",
        "endDate"
      ]
    });
  }
};

module.exports = TreatmentRepository;