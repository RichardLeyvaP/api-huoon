const path = require('path');
const fs = require('fs');
const { MedicalExam, Person, Type, sequelize } = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");
const ImageService = require("../services/ImageService");

const MedicalExamRepository  = {
  async findAll() {
    return await MedicalExam.findAll({
      attributes: [
        "id",
        "person_id",
        "date",
        "type_id",
        "result",
        "archive",
      ],
      include: [
        { model: Type, attributes: ["id", "name"] },    // Incluir datos del tipo de examen
      ],
    });
  },

  async findAllByPersonId(person_id) {
    return await MedicalExam.findAll({
      where: { person_id },
      attributes: [
        "id",
        "person_id",
        "date",
        "type_id",
        "result",
        "archive",
      ],
      include: [
        { model: Type, attributes: ["id", "name"] },
      ],
    });
  },

  async findById(id) {
    return await MedicalExam.findByPk(id, {
      attributes: [
        "id",
        "person_id",
        "date",
        "type_id",
        "result",
        "archive",
      ],
      include: [
        { model: Type, attributes: ["id", "name"] },
      ],
    });
  },

  async create(body, file, t) {
    try {
      // Crear el registro del examen médico
      let newMedicalExam = await MedicalExam.create(
        {
          person_id: body.person_id,
          date: body.date,
          type_id: body.type_id,
          result: body.result,
          archive: "medicalexams/default.jpg", // archive temporal
        },
        { transaction: t }
      );

      // Manejo del archive adjunto si se proporciona
      if (file) {
        const newFilename = ImageService.generateFilename(
          "medicalexams",
          newMedicalExam.id,
          file.originalname
        );
        const fileExtension = path.extname(file.originalname).replace(".", "");
        newMedicalExam.archive = await ImageService.moveFile(file, newFilename);
        await newMedicalExam.update(
          { archive: newMedicalExam.archive },
          { transaction: t }
        );
      }

      return newMedicalExam;
    } catch (err) {
      logger.error(`Error en MedicalExamRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(medicalExamRecord, body, newFile, t) {
    const fieldsToUpdate = [
      "person_id",
      "date",
      "type_id",
      "result",
      "archive",
    ];
    const updatedData = {};

    try {
      // Actualizar campos básicos
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      // Manejar archive nuevo si se proporciona
      if (newFile) {
        const fileExtension = path.extname(newFile.originalname).replace(".", "");
        if (medicalExamRecord.archive && medicalExamRecord.archive !== "medicalexams/default.jpg") {
          await ImageService.deleteFile(medicalExamRecord.archive);
        }
        const newFilename = ImageService.generateFilename(
          "medicalexams",
          medicalExamRecord.id,
          newFile.originalname
        );
        updatedData.archive = await ImageService.moveFile(newFile, newFilename);
      }

      if (Object.keys(updatedData).length > 0) {
        await medicalExamRecord.update(updatedData, { transaction: t });
        logger.info(`Examen médico actualizado exitosamente (ID: ${medicalExamRecord.id})`);
      }

      return medicalExamRecord;
    } catch (err) {
      logger.error(`Error en MedicalExamRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(medicalExamRecord) {
    try {
      // Eliminar archive físico si existe
      if (medicalExamRecord.archive && medicalExamRecord.archive !== "medicalexams/default.jpg") {
        await ImageService.deleteFile(medicalExamRecord.archive);
      }

      // Eliminar registro de la base de datos
      return await medicalExamRecord.destroy();
    } catch (err) {
      logger.error(`Error en MedicalExamRepository->delete: ${err.message}`);
      throw err;
    }
  }
};

module.exports = MedicalExamRepository;