const path = require('path');
const fs = require('fs');
const { PhysicalExam, Person, MedicalConsultation, sequelize } = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");
const ImageService = require("../services/ImageService");

const PhysicalExamRepository  = {
  async findAll() {
    return await PhysicalExam.findAll({
      attributes: [
        "id",
        "person_id",
        "medical_consultation_id",
        "blood_pressure",
        "pulse",
        "exam_date",
        "respiratory_rate",
        "temperature",
        "weight",
        "height",
        "bmi",
        "neurological_observations",
        "cardiovascular_observations",
        "respiratory_observations",
        "digestive_observations",
        "urinary_observations",
        "other_findings"
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
      order: [['exam_date', 'DESC']]
    });
  },

  async findAllByPersonId(person_id) {
    return await PhysicalExam.findAll({
      where: { person_id },
      attributes: [
        "id",
        "medical_consultation_id",
        "blood_pressure",
        "pulse",
        "exam_date",
        "respiratory_rate",
        "temperature",
        "weight",
        "height",
        "bmi",
        "neurological_observations",
        "cardiovascular_observations",
        "respiratory_observations",
        "digestive_observations",
        "urinary_observations",
        "other_findings"
      ],
      include: [
        { 
          model: MedicalConsultation, 
          as: "medicalConsultation" 
        }
      ],
      order: [['exam_date', 'DESC']]
    });
  },

  async findById(id) {
    return await PhysicalExam.findByPk(id, {
      attributes: [
        "id",
        "person_id",
        "medical_consultation_id",
        "blood_pressure",
        "pulse",
        "exam_date",
        "respiratory_rate",
        "temperature",
        "weight",
        "height",
        "bmi",
        "neurological_observations",
        "cardiovascular_observations",
        "respiratory_observations",
        "digestive_observations",
        "urinary_observations",
        "other_findings"
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
      // Crear el registro del examen físico
      const newPhysicalExam = await PhysicalExam.create(
        {
          person_id: body.person_id,
          medical_consultation_id: body.medical_consultation_id || null,
          blood_pressure: body.blood_pressure || null,
          pulse: body.pulse || null,
          exam_date: body.exam_date,
          respiratory_rate: body.respiratory_rate || null,
          temperature: body.temperature || null,
          weight: body.weight || null,
          height: body.height || null,
          bmi: body.bmi || null,
          neurological_observations: body.neurological_observations || null,
          cardiovascular_observations: body.cardiovascular_observations || null,
          respiratory_observations: body.respiratory_observations || null,
          digestive_observations: body.digestive_observations || null,
          urinary_observations: body.urinary_observations || null,
          other_findings: body.other_findings || null
        },
        { transaction: t }
      );

      return newPhysicalExam;
    } catch (err) {
      logger.error(`Error en PhysicalExamRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(physicalExamRecord, body, t) {
    const fieldsToUpdate = [
      "medical_consultation_id",
      "blood_pressure",
      "pulse",
      "exam_date",
      "respiratory_rate",
      "temperature",
      "weight",
      "height",
      "bmi",
      "neurological_observations",
      "cardiovascular_observations",
      "respiratory_observations",
      "digestive_observations",
      "urinary_observations",
      "other_findings"
    ];
    const updatedData = {};

    try {
      // Actualizar campos básicos
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      if (Object.keys(updatedData).length > 0) {
        await physicalExamRecord.update(updatedData, { transaction: t });
        logger.info(`Examen físico actualizado exitosamente (ID: ${physicalExamRecord.id})`);
      }

      return physicalExamRecord;
    } catch (err) {
      logger.error(`Error en PhysicalExamRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(physicalExamRecord) {
    try {
      // Eliminar registro de la base de datos
      return await physicalExamRecord.destroy();
    } catch (err) {
      logger.error(`Error en PhysicalExamRepository->delete: ${err.message}`);
      throw err;
    }
  },

  async calculateBMI(weight, height) {
    if (!weight || !height || height <= 0) return null;
    const bmi = weight / (height * height);
    return parseFloat(bmi.toFixed(2));
  },

  async getLastByPersonId(person_id) {
  try {
    return await PhysicalExam.findOne({
      where: { person_id },
      order: [['exam_date', 'DESC']],
    });
    
  } catch (error) {
    logger.error('Error fetching physical exam:', error);
    throw error; // O maneja el error como prefieras
  }
}
};

module.exports = PhysicalExamRepository;