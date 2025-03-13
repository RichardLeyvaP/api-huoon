const { MedicalExam, Person, Type, sequelize } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importar el logger
const i18n = require("../../config/i18n-config"); // Importar i18n para traducciones
const {
  MedicalExamRepository,
  PersonRepository,
  TypeRepository,
} = require("../repositories"); // Asegúrate de tener un repositorio para MedicalExam

const MedicalExamController = {
  // Obtener todos los registros de exámenes médicos
  async index(req, res) {
    logger.info(
      `${req.user.name} - Entra a buscar los registros de exámenes médicos`
    );

    try {
      const medicalExams = await MedicalExamRepository.findAll();

      if (!medicalExams.length) {
        return res.status(204).json({ msg: "MedicalExamsNotFound" });
      }

      // Mapear la respuesta
      const mappedMedicalExams = medicalExams.map((exam) => {
        const translatedName =
          i18n.__(`types.${exam.type.name}.name`) !==
          `types.${exam.type.name}.name`
            ? i18n.__(`types.${exam.type.name}.name`)
            : exam.type.name;

        return {
          id: exam.id,
          personId: exam.person_id,
          person_id: exam.person_id,
          date: exam.date,
          typeId: exam.type_id,
          type_id: exam.type_id,
          typeName: translatedName, // Incluir nombre del tipo de examen
          result: exam.result,
          archive: exam.archive,
        };
      });

      res.status(200).json({ medicalExams: mappedMedicalExams });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalExamController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener exámenes médicos por person_id
  async getByPersonId(req, res) {
    logger.info(
      `${req.user.name} - Entra a buscar los exámenes médicos de una persona`
    );

    const person_id = req.person.id;

    try {
      const medicalExams = await MedicalExamRepository.findAllByPersonId(
        person_id
      );

      if (!medicalExams.length) {
        return res.status(204).json({ msg: "MedicalExamsNotFound" });
      }

      // Mapear la respuesta
      const mappedMedicalExams = medicalExams.map((exam) => {
        const translatedName =
          i18n.__(`types.${exam.type.name}.name`) !==
          `types.${exam.type.name}.name`
            ? i18n.__(`types.${exam.type.name}.name`)
            : exam.type.name;
        return {
          id: exam.id,
          personId: exam.person_id,
          person_id: exam.person_id,
          date: exam.date,
          typeId: exam.type_id,
          type_id: exam.type_id,
          typeName: translatedName,
          result: exam.result,
          archive: exam.archive,
        };
      });

      res.status(200).json({ medicalExams: mappedMedicalExams });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalExamController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear un nuevo registro de examen médico
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo registro de examen médico`);
    logger.info("Datos recibidos al crear un examen médico:");
    logger.info(JSON.stringify(req.body));

    req.body.person_id = req.person.id; // Asignar el ID de la persona autenticada
    const { date, type_id, result, archive } = req.body;

    // Verificar si el tipo de examen existe
    const type = await TypeRepository.findById(type_id);
    if (!type) {
      logger.error(
        `MedicalExamController->store: Tipo de examen no encontrado con ID ${type_id}`
      );
      return res.status(404).json({ msg: "TypeNotFound" });
    }

    const t = await sequelize.transaction();
    try {
      const medicalExam = await MedicalExamRepository.create(
        req.body,
        req.file,
        t
      );
      await t.commit();
      res.status(201).json({ medicalExam });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalExamController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener un examen médico por ID
  async show(req, res) {
    logger.info(`${req.user.name} - Entra a buscar un examen médico`);

    const { id } = req.body;

    try {
      const medicalExam = await MedicalExamRepository.findById(id);

      if (!medicalExam) {
        return res.status(404).json({ msg: "MedicalExamNotFound" });
      }

      const mappedMedicalExam = {
        id: medicalExam.id,
        personId: medicalExam.person_id,
        person_id: medicalExam.person_id,
        date: medicalExam.date,
        typeId: medicalExam.type_id,
        type_id: medicalExam.type_id,
        typeName: medicalExam.Type ? medicalExam.Type.name : null,
        result: exam.result,
        archive: exam.archive,
      };

      res.status(200).json({ medicalExam: mappedMedicalExam });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalExamController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un examen médico
  async update(req, res) {
    logger.info(
      `${req.user.name} - Actualiza el examen médico con ID ${req.body.id}`
    );
    logger.info("Datos recibidos al editar un examen médico:");
    logger.info(JSON.stringify(req.body));

    const { id } = req.body;
    const { date, type_id, result, archive } = req.body;

    const medicalExam = await MedicalExamRepository.findById(id);

    if (!medicalExam) {
      logger.error(
        `MedicalExamController->update: Examen médico no encontrado con ID ${id}`
      );
      return res.status(404).json({ msg: "MedicalExamNotFound" });
    }

    // Verificar si el tipo de examen existe
    if (type_id) {
      const type = await TypeRepository.findById(type_id);
      if (!type) {
        logger.error(
          `MedicalExamController->update: Tipo de examen no encontrado con ID ${type_id}`
        );
        return res.status(404).json({ msg: "TypeNotFound" });
      }
    }

    const t = await sequelize.transaction();
    try {
      const updatedMedicalExam = await MedicalExamRepository.update(
        medicalExam,
        req.body,
        req.file,
        t
      );
      await t.commit();
      res.status(200).json({ medicalExam: updatedMedicalExam });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalExamController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un examen médico
  async destroy(req, res) {
    logger.info(
      `${req.user.name} - Elimina el examen médico con ID ${req.body.id}`
    );

    try {
      const medicalExam = await MedicalExamRepository.findById(req.body.id);

      if (!medicalExam) {
        return res.status(404).json({ msg: "MedicalExamNotFound" });
      }

      await MedicalExamRepository.delete(medicalExam);

      res.status(200).json({ msg: "MedicalExamDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("MedicalExamController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = MedicalExamController;
