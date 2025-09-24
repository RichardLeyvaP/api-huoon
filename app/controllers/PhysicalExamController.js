const { PhysicalExam, Person, MedicalConsultation, sequelize } = require("../models");
const logger = require("../../config/logger");
const i18n = require("../../config/i18n-config");
const {
  PhysicalExamRepository,
  PersonRepository,
  MedicalConsultationRepository
} = require("../repositories");

const PhysicalExamController = {
  // Obtener todos los registros de exámenes físicos
  async index(req, res) {
    logger.info(`${req.user.name} - Buscando registros de exámenes físicos`);

    try {
      const physicalExams = await PhysicalExamRepository.findAll();

      if (!physicalExams.length) {
        return res.status(204).json({ msg: "PhysicalExamsNotFound" });
      }

      // Mapear la respuesta
      const mappedPhysicalExams = physicalExams.map((exam) => ({
        id: exam.id,
        personId: exam.person_id,
        person_id: exam.person_id,
        medicalConsultationId: exam.medical_consultation_id,
        medical_consultation_id: exam.medical_consultation_id,
        bloodPressure: exam.blood_pressure,
        pulse: exam.pulse,
        examDate: exam.exam_date,
        exam_date: exam.exam_date,
        respiratoryRate: exam.respiratory_rate,
        respiratory_rate: exam.respiratory_rate,
        temperature: exam.temperature,
        weight: exam.weight,
        height: exam.height,
        bmi: exam.bmi,
        neurologicalObservations: exam.neurological_observations,
        neurological_observations: exam.neurological_observations,
        cardiovascularObservations: exam.cardiovascular_observations,
        cardiovascular_observations: exam.cardiovascular_observations,
        respiratoryObservations: exam.respiratory_observations,
        respiratory_observations: exam.respiratory_observations,
        digestiveObservations: exam.digestive_observations,
        digestive_observations: exam.digestive_observations,
        urinaryObservations: exam.urinary_observations,
        urinary_observations: exam.urinary_observations,
        otherFindings: exam.other_findings,
        other_findings: exam.other_findings,
      }));

      res.status(200).json({ physicalExams: mappedPhysicalExams });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PhysicalExamController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener exámenes físicos por person_id
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Buscando exámenes físicos de una persona`);
    const { query , person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person.id;

    try {
      const physicalExams = await PhysicalExamRepository.findByPersonId(person_id, query);

      if (!physicalExams.length) {
        return res.status(204).json({ msg: "PhysicalExamsNotFound" });
      }

      // Mapear la respuesta
      const mappedPhysicalExams = physicalExams.map((exam) => ({
        id: exam.id,
        personId: exam.person_id,
        person_id: exam.person_id,
        medicalConsultationId: exam.medical_consultation_id,
        medical_consultation_id: exam.medical_consultation_id,
        bloodPressure: exam.blood_pressure,
        blood_pressure: exam.blood_pressure,
        pulse: exam.pulse,
        examDate: exam.exam_date,
        exam_date: exam.exam_date,
        respiratoryRate: exam.respiratory_rate,
        respiratory_rate: exam.respiratory_rate,
        temperature: exam.temperature,
        weight: exam.weight,
        height: exam.height,
        bmi: exam.bmi,
        neurologicalObservations: exam.neurological_observations,
        neurological_observations: exam.neurological_observations,
        cardiovascularObservations: exam.cardiovascular_observations,
        cardiovascular_observations: exam.cardiovascular_observations,
        respiratoryObservations: exam.respiratory_observations,
        respiratory_observations: exam.respiratory_observations,
        digestiveObservations: exam.digestive_observations,
        digestive_observations: exam.digestive_observations,
        urinaryObservations: exam.urinary_observations,
        urinary_observations: exam.urinary_observations,
        otherFindings: exam.other_findings,
        other_findings: exam.other_findings,
      }));

      res.status(200).json({ physicalExams: mappedPhysicalExams });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PhysicalExamController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear un nuevo registro de examen físico
  async store(req, res) {
    logger.info(`${req.user.name} - Creando nuevo examen físico`);
    logger.debug("Datos recibidos:", req.body);
    const { person_id: bodyPersonId } = req.body;
        const person_id = bodyPersonId || req.person.id;
    req.body.person_id = person_id; // Asignar el ID de la persona autenticada

    // Verificar si la consulta médica existe si se proporciona
    if (req.body.medical_consultation_id) {
      const consultation = await MedicalConsultationRepository.findById(req.body.medical_consultation_id);
      if (!consultation) {
        logger.error(`Consulta médica no encontrada con ID ${req.body.medical_consultation_id}`);
        return res.status(404).json({ msg: "MedicalConsultationNotFound" });
      }
    }

    // Calcular BMI si se proporcionan peso y altura
    if (req.body.weight && req.body.height) {
      req.body.bmi = await PhysicalExamRepository.calculateBMI(
        parseFloat(req.body.weight),
        parseFloat(req.body.height)
      );
    }

    const t = await sequelize.transaction();
    try {
      const physicalExam = await PhysicalExamRepository.create(req.body, t);
      await t.commit();
      
      res.status(201).json({ 
        physicalExam: {
          ...physicalExam.toJSON(),
          bmi: req.body.bmi // Asegurar que el BMI calculado se incluya
        } 
      });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PhysicalExamController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener un examen físico por ID
  async show(req, res) {
    logger.info(`${req.user.name} - Buscando examen físico con ID ${req.body.id}`);

    try {
      const physicalExam = await PhysicalExamRepository.findById(req.body.id);

      if (!physicalExam) {
        return res.status(404).json({ msg: "PhysicalExamNotFound" });
      }

      const mappedPhysicalExam = {
        id: physicalExam.id,
        personId: physicalExam.person_id,
        person_id: physicalExam.person_id,
        medicalConsultationId: physicalExam.medical_consultation_id,
        medical_consultation_id: physicalExam.medical_consultation_id,
        bloodPressure: physicalExam.blood_pressure,
        pulse: physicalExam.pulse,
        examDate: physicalExam.exam_date,
        exam_date: physicalExam.exam_date,
        respiratoryRate: physicalExam.respiratory_rate,
        respiratory_rate: physicalExam.respiratory_rate,
        temperature: physicalExam.temperature,
        weight: physicalExam.weight,
        height: physicalExam.height,
        bmi: physicalExam.bmi,
        neurologicalObservations: physicalExam.neurological_observations,
        neurological_observations: physicalExam.neurological_observations,
        cardiovascularObservations: physicalExam.cardiovascular_observations,
        cardiovascular_observations: physicalExam.cardiovascular_observations,
        respiratoryObservations: physicalExam.respiratory_observations,
        respiratory_observations: physicalExam.respiratory_observations,
        digestiveObservations: physicalExam.digestive_observations,
        digestive_observations: physicalExam.digestive_observations,
        urinaryObservations: physicalExam.urinary_observations,
        urinary_observations: physicalExam.urinary_observations,
        otherFindings: physicalExam.other_findings,
        other_findings: physicalExam.other_findings,
      };

      res.status(200).json({ physicalExam: mappedPhysicalExam });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PhysicalExamController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un examen físico
  async update(req, res) {
    logger.info(`${req.user.name} - Actualizando examen físico con ID ${req.body.id}`);
    logger.debug("Datos recibidos:", req.body);

    try {
      const physicalExam = await PhysicalExamRepository.findById(req.body.id);

      if (!physicalExam) {
        return res.status(404).json({ msg: "PhysicalExamNotFound" });
      }

      // Verificar si la consulta médica existe si se proporciona
      if (req.body.medical_consultation_id) {
        const consultation = await MedicalConsultationRepository.findById(req.body.medical_consultation_id);
        if (!consultation) {
          logger.error(`Consulta médica no encontrada con ID ${req.body.medical_consultation_id}`);
          return res.status(404).json({ msg: "MedicalConsultationNotFound" });
        }
      }

      // Calcular BMI si se actualizan peso o altura
      if (req.body.weight || req.body.height) {
        const weight = req.body.weight || physicalExam.weight;
        const height = req.body.height || physicalExam.height;
        if (weight && height) {
          req.body.bmi = await PhysicalExamRepository.calculateBMI(
            parseFloat(weight),
            parseFloat(height)
          );
        }
      }

      const t = await sequelize.transaction();
      try {
        const updatedPhysicalExam = await PhysicalExamRepository.update(
          physicalExam,
          req.body,
          t
        );
        await t.commit();
        
        res.status(200).json({ physicalExam: updatedPhysicalExam });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PhysicalExamController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un examen físico
  async destroy(req, res) {
    logger.info(`${req.user.name} - Eliminando examen físico con ID ${req.body.id}`);

    try {
      const physicalExam = await PhysicalExamRepository.findById(req.body.id);

      if (!physicalExam) {
        return res.status(404).json({ msg: "PhysicalExamNotFound" });
      }

      await PhysicalExamRepository.delete(physicalExam);

      res.status(200).json({ msg: "PhysicalExamDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PhysicalExamController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener el último examen físico de una persona
  async getLastByPersonId(req, res) {
    logger.info(`${req.user.name} - Buscando último examen físico de la persona`);

    try {
      const lastExam = await PhysicalExamRepository.getLastByPersonId(req.person.id);

      if (!lastExam) {
        return res.status(204).json({ msg: "PhysicalExamNotFound" });
      }

      res.status(200).json({ lastPhysicalExam: lastExam });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PhysicalExamController->getLastByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  }
};

module.exports = PhysicalExamController;