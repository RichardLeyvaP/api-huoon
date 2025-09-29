const { Op } = require("sequelize");
const { MedicalConsultation, Person, Type, Home } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger
const ImageService = require("../services/ImageService");


const MedicalConsultationRepository = {
  /**
   * Obtener todas las consultas médicas.
   */
  async findAll() {
    return await MedicalConsultation.findAll({
      include: [
        { model: Person, as: "person" }, // Relación con Person
        { model: Type, as: "type" },
      ],
    });
  },

  /**
   * Obtener todas las consultas médicas de una persona específica.
   * @param {number} personId - ID de la persona.
   */
  async findAllByPersonId(personId) {
    return await MedicalConsultation.findAll({
      where: { person_id: personId }, // Filtrar por personId
      include: [
        { model: Person, as: "person" }, // Relación con Person
        { model: Type, as: "type" },
      ],
       order: [['date', 'DESC']],
    });
  },

  async findLastByPersonId(personId) {
  return await MedicalConsultation.findOne({
    where: { person_id: personId },
    include: [
      { model: Person, as: "person" },
      { model: Type, as: "type" }
    ],
    order: [['date', 'DESC']], // Ordenar por fecha descendente
    limit: 1 // Limitar a 1 resultado
  });
},

  /**
   * Obtener una consulta médica por su ID.
   * @param {number} id - ID de la consulta médica.
   */
  async findById(id) {
    return await MedicalConsultation.findByPk(id, {
      include: [
        { model: Person, as: "person" }, // Relación con Person
        { model: Type, as: "type" },
      ],
    });
  },

  /**
   * Crear una nueva consulta médica.
   * @param {object} body - Datos de la consulta médica.
   * @param {number} personId - ID de la persona asociada.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async create(body, files = [], t = null) {
    try {
      // Crear la consulta médica sin los archivos
      const newFile = await MedicalConsultation.create(
        {
          date: body.date,
          reason: body.reason,
          diagnosis: body.diagnosis,
          treatments: body.treatments,
          medicalNotes: body.medicalNotes,
          files: [], // Inicialmente, los archivos están vacíos
          person_id: body.person_id,
          type_id: body.type_id,
          professional: body.professional
        },
        { transaction: t }
      );

      if (files && files.length > 0) {
        const updatedFiles = []; // Array para almacenar la información de los archivos procesados

        for (const file of files) {
          const { id, name } = files; // Extraer solo `id` y `name`
          const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "");

          // Verificar si el archivo está presente
          if (file && file.originalname) {
            // Generar un nuevo nombre para el archivo
            const newFilename = ImageService.generateFilename(
              "consultations",
              timestamp,
              file.originalname // Usar `file.originalname` directamente
            );

            // Mover el archivo a la ubicación deseada
            const filePath = await ImageService.moveFile(
              file, // Usar `file` directamente
              newFilename
            );

            // Agregar la información del archivo al array
            updatedFiles.push({
              id: parseInt(timestamp), // Asegurarse de que el ID sea un número
              name: file.originalname, // Usar `file.originalname` directamente
              path: filePath, // Ruta del archivo movido
            });
          } else {
            logger.info("No hay un archivo válido");
          }
        }

        // Actualizar el campo `files` en la base de datos
        if (updatedFiles.length > 0) {
          await newFile.update({ files: updatedFiles }, { transaction: t });
        }
      }

      return newFile;
    } catch (err) {
      logger.error(
        `Error en MedicalConsultationRepository->create: ${err.message}`
      );
      throw err;
    }
  },
  /**
   * Actualizar una consulta médica existente.
   * @param {object} medicalConsultation - Instancia de la consulta médica.
   * @param {object} body - Datos actualizados.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async update(medicalConsultation, body, files, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "date",
      "reason",
      "diagnosis",
      "treatments",
      "medicalNotes",
      "files",
      "type_id",
      "professional"
    ];

    try {
      // Filtrar campos en body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Obtener los archivos antiguos de la consulta médica
      const oldFiles = Array.isArray(medicalConsultation.files)
          ? medicalConsultation.files // Si ya es un array, úsalo directamente
          : JSON.parse(medicalConsultation.files || "[]");

        const updatedFiles = [...oldFiles]; // Copiar los archivos antiguos

      for (const oldFile of oldFiles) {
        const existsInNewFiles = body.files.some((newFile) => {
          // Convertir ambos IDs a string (o número) para asegurar una comparación correcta
          return newFile.name === oldFile.name;
        });

        if (!existsInNewFiles) {
          // Si el archivo antiguo no está en los nuevos, eliminarlo del servidor
          await ImageService.deleteFile(oldFile.path);

          // Eliminar el archivo del array updatedFiles
          const fileIndex = updatedFiles.findIndex(
            (file) => file.name === oldFile.name
          );
          if (fileIndex !== -1) {
            updatedFiles.splice(fileIndex, 1);
          }
        }
      }

      // Procesar archivos nuevos si se enviaron
      if (files && files.length > 0) {
        // Procesar archivos nuevos
        for (const file of files) {
          const { file: uploadedFile } = file;

          // Si el archivo es nuevo (no tiene ID o no está en los antiguos) y tiene un archivo adjunto
          if (file && file.originalname) {
            const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "");
            // Generar un nuevo nombre para el archivo
            const newFilename = ImageService.generateFilename(
              "consultations",
              timestamp,
              file.originalname // Asegurarse de que uploadedFile no sea null
            );

            // Mover el archivo a la ubicación deseada
            const filePath = await ImageService.moveFile(file, newFilename);
            updatedFiles.push({
              id: parseInt(timestamp), // Generar un nuevo ID
              name: file.originalname,
              path: filePath, // Ruta del archivo movido
            });
          }
        }
      }
      // Asignar los archivos actualizados al objeto updatedData
      updatedData.files = updatedFiles;

      // Actualizar la consulta médica solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await medicalConsultation.update(updatedData, { transaction: t });
        logger.info(
          `Consulta médica actualizada exitosamente (ID: ${medicalConsultation.id})`
        );
      }

      return updatedData;
    } catch (err) {
      logger.error(
        `Error en MedicalConsultationRepository->update: ${err.message}`
      );
      throw err;
    }
  },
  /**
   * Eliminar una consulta médica.
   * @param {object} medicalConsultation - Instancia de la consulta médica.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async delete(medicalConsultation, t = null) {
    try {
      if (medicalConsultation.files && medicalConsultation.files.length > 0) {
        await ImageService.deleteFileArray(medicalConsultation.files);
      }
      await medicalConsultation.destroy({ transaction: t });
      logger.info(
        `Consulta médica eliminada exitosamente (ID: ${medicalConsultation.id})`
      );
    } catch (err) {
      logger.error(
        `Error en MedicalConsultationRepository->delete: ${err.message}`
      );
      throw err;
    }
  },

  async findFamilyMembersWithConsultationsByHomeId(homeId, startDate, endDate, personId = null) 
    {
    try {
      // Calcular semana actual si no se pasan fechas
      if (!startDate || !endDate) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Domingo) a 6 (Sábado)
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        startDate = new Date(now);
        startDate.setDate(now.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }

       const whereHome = { id: homeId };
      const wherePerson = personId ? { id: personId } : {};
      // Consultar personas del hogar con consultas en el rango
      const familyMembers = await Person.findAll({
        where: wherePerson,
        include: [
          {
            model: MedicalConsultation,
            as: 'medicalconsultations',
            where: {
              date: {
                [Op.between]: [startDate, endDate]
              },
            },
            include: [
              { model: Type, as: "type" },
            ],
            required: false, // Solo personas que TENGAN consultas en el rango
            order: [['startDate', 'DESC']],
          },
          {
            model: Home,
            as: 'homePersons',
            where: { id: homeId },
            required: true, // Solo personas que PERTENEZCAN al hogar
          },
        ],
        distinct: true, // Evitar duplicados si hay múltiples consultas
      });

      return familyMembers;

    } catch (error) {
      logger.error('MedicalConsultationRepository->findFamilyMembersWithConsultationsByHomeId:', error.message);
      throw new Error(`Error fetching family members with consultations: ${error.message}`);
    }
  }
  
};

module.exports = MedicalConsultationRepository;
