const path = require('path');
const fs = require('fs');
const { File, Person, Home, sequelize } = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");
const ImageService = require("../services/ImageService");

class FileRepository {
  async findAll() {
    return await File.findAll({
      attributes: [
        "id",
        "name",
        "archive",
        "type",
        "size",
        "date",
        "description",
        "person_id",
        "home_id",
        "personal",
      ],
    });
  }

  async findAllType(id, home_id = null, personal) {
    const whereConditions = {};

    if (personal === 1) {
      whereConditions.personal = 1;
      whereConditions.person_id = id;
    } else if (personal === 0) {
      whereConditions.personal = 0;
      whereConditions.home_id = home_id;
    } else {
        whereConditions[Op.or] = [
            { home_id: home_id, personal: 0 },   // Registros del hogar
            { person_id: id, personal: 1 }       // Registros personales
          ];
    }

    return await File.findAll({
      where: whereConditions,
      attributes: [
        "id",
        "name",
        "archive",
        "type",
        "size",
        "date",
        "description",
        "person_id",
        "home_id",
        "personal",
      ],
    });
  }

  async findById(id) {
    return await File.findByPk(id, {
      attributes: [
        "id",
        "name",
        "archive",
        "type",
        "size",
        "date",
        "description",
        "person_id",
        "home_id",
        "personal",
      ],
    });
  }

  async create(body, file, t) {
    try {
      // Crear el registro del archivo
      let newFile = await File.create(
        {
          name: body.name,
          archive: "files/default.jpg", // archive temporal
          type: body.type, // Obtener tipo del archivo
          size: body.size, // Obtener tamaño del archivo
          date: body.date || new Date(),
          description: body.description,
          person_id: body.person_id,
          home_id: body.home_id,
          personal: body.personal,
        },
        { transaction: t }
      );

      // Manejo del archivo subido
      if (file) {
        const newFilename = ImageService.generateFilename(
          "files",
          newFile.id,
          file.originalname
        );
        // Usar la extensión del archivo en lugar del MIME type
        const fileExtension = path.extname(file.originalname).replace(".", "");
        newFile.archive = await ImageService.moveFile(file, newFilename);
        await newFile.update({ archive: newFile.archive, type: fileExtension, size: file.size }, { transaction: t });
      }

      return newFile;
    } catch (err) {
      logger.error(`Error en FileRepository->create: ${err.message}`);
      throw err;
    }
  }

  async update(fileRecord, body, newFile, t) {
    const fieldsToUpdate = [
      "name",
      "type",
      "size",
      "archive",
      "date",
      "description",
      "person_id",
      "home_id",
      "personal",
    ];
    const updatedData = {};

    try {
      // Actualizar campos básicos
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      // Manejar archivo nuevo si se proporciona
      if (newFile) {
        const fileExtension = path.extname(newFile.originalname).replace(".", "");
        updatedData.type = fileExtension;
        updatedData.size = newFile.size;
        if (fileRecord.archive && fileRecord.archive !== "files/default.jpg") {
            await ImageService.deleteFile(fileRecord.archive);
          }
          const newFilename = ImageService.generateFilename(
            "files",
            fileRecord.id,
            newFile.originalname
          );
          updatedData.archive = await ImageService.moveFile(
            newFile,
            newFilename
          );
        }

      if (Object.keys(updatedData).length > 0) {
        await fileRecord.update(updatedData, { transaction: t });
        logger.info(`Archivo actualizado exitosamente (ID: ${fileRecord.id})`);
      }

      return fileRecord;
    } catch (err) {
      logger.error(`Error en FileRepository->update: ${err.message}`);
      throw err;
    }
  }

  async delete(fileRecord) {
    try {
      // Eliminar archivo físico
      if (fileRecord.archive && fileRecord.archive !== "files/default.jpg") {
        await ImageService.deleteFile(fileRecord.archive);
      }

      // Eliminar registro de la base de datos
      return await fileRecord.destroy();
    } catch (err) {
      logger.error(`Error en FileRepository->delete: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new FileRepository();
