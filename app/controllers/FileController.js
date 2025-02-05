const { File, Person, Home, sequelize } = require("../models");
const logger = require("../../config/logger");
const i18n = require("../../config/i18n-config");
const { FileRepository, PersonRepository, HomeRepository } = require("../repositories");

const FileController = {
  // Obtener todos los archivos
  async index(req, res) {
    logger.info(`${req.user.name} - Buscando todos los archivos`);

    try {
      const files = await FileRepository.findAll();

      if (!files.length) {
        return res.status(204).json({ msg: "FilesNotFound" });
      }

      const mappedFiles = files.map((file) => ({
        id: file.id,
        name: file.name,
        archive: file.archive,
        type: file.type,
        size: file.size,
        date: file.date,
        description: file.description,
        person_id: file.person_id,
        personId: file.person_id,
        homeId: file.home_id,
        home_id: file.home_id,
        personal: file.personal,
      }));

      res.status(200).json({ files: mappedFiles });
    } catch (error) {
      const errorMsg = error.details?.map(detail => detail.message).join(", ") || error.message;
      logger.error("FileController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener archivos por tipo (personal/hogar)
  async getTypeFiles(req, res) {
    logger.info(`${req.user.name} - Buscando archivos por tipo`);
    req.body.person_id = req.person.id;
    const { person_id, home_id, personal } = req.body;

    // Verificar si la persona existe
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `FinanceController->store: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }

    // Verificar si la persona existe y pertenece al hogar
    const person = await PersonRepository.getPersonHouse(person_id, home_id);

    if (!person) {
      logger.error(
        `FileController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`
      );
      return res.status(404).json({ msg: "PersonNotAssociatedWithHome" });
    }
    
    try {
      let files = [];

      files = await FileRepository.findAllType(person_id, home_id, personal);

      if (!files.length) {
        return res.status(204).json({ msg: "FilesNotFound" });
      }

      const mappedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        archive: file.archive,
        type: file.type,
        size: file.size,
        date: file.date,
        description: file.description,
        person_id: file.person_id,
        personId: file.person_id,
        homeId: file.home_id,
        home_id: file.home_id,
        personal: file.personal,
      }));

      res.status(200).json({ files: mappedFiles });
    } catch (error) {
      const errorMsg = error.details?.map(detail => detail.message).join(", ") || error.message;
      logger.error("FileController->getTypeFiles: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear nuevo archivo
  async store(req, res) {
    logger.info(`${req.user.name} - Creando nuevo archivo`);
    logger.info("datos recibidos al crear un Archivo");
    logger.info(JSON.stringify(req.body));
    
    req.body.person_id = req.person.id;
    const { person_id, home_id } = req.body;

    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `FileController->store: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }

    // Verificar si la persona existe y pertenece al hogar
    const person = await PersonRepository.getPersonHouse(person_id, home_id);

    if (!person) {
      logger.error(
        `FileController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`
      );
      return res.status(404).json({ msg: "PersonNotAssociatedWithHome" });
    }

    const t = await sequelize.transaction();
    try {
      const newFile = await FileRepository.create(req.body, req.file, t);
      await t.commit();
      
      res.status(201).json({ 
        file: {
          ...newFile.toJSON()
        }
      });
    } catch (error) {
        if (!t.finished) {
            await transaction.rollback();
          }
      const errorMsg = error.details?.map(detail => detail.message).join(", ") || error.message;
      logger.error("FileController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener un archivo por ID
  async show(req, res) {
    logger.info(`${req.user.name} - Buscando archivo por ID`);
    const { id } = req.body;

    try {
      const file = await FileRepository.findById(id);
      if (!file) {
        return res.status(404).json({ msg: "FileNotFound" });
      }

      res.status(200).json({ 
        file: {
          ...file.toJSON(),
          size: this.formatFileSize(file.size)
        }
      });
    } catch (error) {
      const errorMsg = error.details?.map(detail => detail.message).join(", ") || error.message;
      logger.error("FileController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un archivo
  async update(req, res) {
    logger.info(`${req.user.name} - Actualizando archivo`);
    const { id, homeId, isPersonal } = req.body;


      const file = await FileRepository.findById(id);
      if (!file) {
        return res.status(404).json({ msg: "FileNotFound" });
      }

      const t = await sequelize.transaction();
      try {
      const updatedFile = await FileRepository.update(file, req.body, req.file, t);
      await t.commit();

      res.status(200).json({ 
        file: {
          ...updatedFile.toJSON()
        }
      });
    } catch (error) {
        await t.rollback();
      const errorMsg = error.details?.map(detail => detail.message).join(", ") || error.message;
      logger.error("FileController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un archivo
  async destroy(req, res) {
    logger.info(`${req.user.name} - Eliminando archivo`);
    const { id } = req.body;

    try {
      const file = await FileRepository.findById(id);
      if (!file) {
        return res.status(404).json({ msg: "FileNotFound" });
      }

      await FileRepository.delete(file);
      res.status(200).json({ msg: "FileDeleted" });
    } catch (error) {
      const errorMsg = error.details?.map(detail => detail.message).join(", ") || error.message;
      logger.error("FileController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Helper para formatear tamaño de archivo
  formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${Math.round(bytes / Math.pow(1024, i), 2)} ${sizes[i]}`;
  }
};

module.exports = FileController;