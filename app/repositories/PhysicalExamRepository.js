const path = require('path');
const fs = require('fs');
const { PhysicalExam, Person, MedicalConsultation, Home, sequelize } = require("../models");
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

  async findByPersonId(person_id, filterAttribute = null) {
  // Definir atributos base que siempre se devuelven
  const baseAttributes = ["id", "exam_date"];

  // Si se pasa un filtro, agregar ese atributo y filtrar por NOT NULL
  let whereClause = { person_id };

  if (filterAttribute) {
    // Asegurarse de que el atributo existe en el modelo (opcional, para seguridad)
    const validAttributes = [
      "blood_pressure",
      "pulse",
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

    if (!validAttributes.includes(filterAttribute)) {
      throw new Error(`Invalid filter attribute: ${filterAttribute}`);
    }

    // Agregar el atributo al SELECT
    baseAttributes.push(filterAttribute);

    // Agregar condición: atributo IS NOT NULL
    whereClause[filterAttribute] = { [Op.not]: null };
  } else {
    // Si no hay filtro, devolver todos los atributos como antes
    baseAttributes.push(
      "medical_consultation_id",
      "blood_pressure",
      "pulse",
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
    );
  }

  return await PhysicalExam.findAll({
    where: whereClause,
    attributes: baseAttributes,
    include: [
      {
        model: MedicalConsultation,
        as: "medicalConsultation"
      }
    ],
    order: [["exam_date", "DESC"]]
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
},
async getLastByPersonQuery(person_id, field = null) {
  try {
    const whereClause = { person_id };

    // Si se pasa un campo, agregar condición: campo IS NOT NULL
    if (field) {
      whereClause[field] = { [Op.not]: null };
    }

    return await PhysicalExam.findOne({
      where: whereClause,
      order: [["exam_date", "DESC"]],
    });
  } catch (error) {
    logger.error("Error fetching physical exam:", error);
    throw error;
  }
},
/*async findHouseholdHealthMetrics(homeId) {
  try {
    logger.info(`Buscando métricas de salud para hogar ID: ${homeId}`);

    const personIds = await Person.findAll({
      attributes: ['id'],
      include: [
        {
          model: Home,
          as: 'homePersons',
          where: { id: homeId },
          required: true,
        },
      ],
      raw: true,
      nest: true,
    }).then(rows => rows.map(row => row.id));


    if (personIds.length === 0) {
      return {
        totalMembers: 0,
        countNormalBloodPressure: 0,
        countHealthyWeight: 0,
      };
    }

    const sequelize = PhysicalExam.sequelize;

    // ✅ CONSULTA 1: ÚLTIMO EXAMEN CON blood_pressure NO NULL (por persona)
    const bpQuery = `
      SELECT person_id, blood_pressure, exam_date
      FROM (
        SELECT person_id, blood_pressure, exam_date,
               ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY exam_date DESC) as rn
        FROM physical_exams
        WHERE person_id IN (${personIds.join(',')})
          AND blood_pressure IS NOT NULL
      ) ranked
      WHERE rn = 1
    `;
    const lastBPExamsRaw = await sequelize.query(bpQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // ✅ CONSULTA 2: ÚLTIMO EXAMEN CON weight NO NULL (por persona)
    const weightQuery = `
      SELECT person_id, weight, exam_date
      FROM (
        SELECT person_id, weight, exam_date,
               ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY exam_date DESC) as rn
        FROM physical_exams
        WHERE person_id IN (${personIds.join(',')})
          AND weight IS NOT NULL
      ) ranked
      WHERE rn = 1
    `;
    const lastWeightExamsRaw = await sequelize.query(weightQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // ✅ CONSULTA 3: ÚLTIMO EXAMEN CON height NO NULL (por persona)
    const heightQuery = `
      SELECT person_id, height, exam_date
      FROM (
        SELECT person_id, height, exam_date,
               ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY exam_date DESC) as rn
        FROM physical_exams
        WHERE person_id IN (${personIds.join(',')})
          AND height IS NOT NULL
      ) ranked
      WHERE rn = 1
    `;
    const lastHeightExamsRaw = await sequelize.query(heightQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // Convertir a Map
    const bpMap = new Map(lastBPExamsRaw.map(exam => [exam.person_id, exam]));
    const weightMap = new Map(lastWeightExamsRaw.map(exam => [exam.person_id, exam]));
    const heightMap = new Map(lastHeightExamsRaw.map(exam => [exam.person_id, exam]));

    let countNormalBloodPressure = 0;
    let countHealthyWeight = 0;

    for (const personId of personIds) {
      const bpExam = bpMap.get(personId);
      const weightExam = weightMap.get(personId);
      const heightExam = heightMap.get(personId);
      // ✅ Presión arterial normal
      if (bpExam && bpExam.blood_pressure !== null) {
        let systolic, diastolic;
        const rawBP = bpExam.blood_pressure;

        if (typeof rawBP === 'string') {
          const parts = rawBP.split('/').map(p => p.trim());
          systolic = parseInt(parts[0], 10);
          diastolic = parseInt(parts[1], 10);
        } else if (Array.isArray(rawBP)) {
          [systolic, diastolic] = rawBP;
        } else if (typeof rawBP === 'object' && rawBP !== null) {
          systolic = rawBP.systolic || rawBP.sys || rawBP.systolicValue || 0;
          diastolic = rawBP.diastolic || rawBP.dia || rawBP.diastolicValue || 0;
        } else {
          systolic = Number(rawBP);
          diastolic = 0;
        }

        if (!isNaN(systolic) && !isNaN(diastolic)) {
          if (systolic <= 120 && diastolic <= 80) {
            countNormalBloodPressure++;
          }
        }
      }

      // ✅ IMC (peso saludable)
      if (weightExam && heightExam) {
        const weight = weightExam.weight;
        const height = heightExam.height;

        // ✅ IMPORTANTE: height YA ESTÁ EN METROS (1.50), NO EN CM
        const heightInMeters = height; // 👈 ¡NO DIVIDES POR 100!
        const bmi = weight / (heightInMeters * heightInMeters);

        if (isNaN(bmi)) {
        } else if (bmi >= 18.5 && bmi <= 24.9) {
          countHealthyWeight++;
        } 
      }
    }

    logger.info(`📊 RESULTADO FINAL:`);
    logger.info(`   Total de miembros: ${personIds.length}`);
    logger.info(`   Presión arterial normal: ${countNormalBloodPressure}`);
    logger.info(`   Peso saludable: ${countHealthyWeight}`);

    return {
      totalMembers: personIds.length,
      countNormalBloodPressure,
      countHealthyWeight,
    };

  } catch (error) {
    logger.error('PhysicalExamRepository->findHouseholdHealthMetrics:', error.message);
    throw new Error(`Error fetching household health metrics: ${error.message}`);
  }
}*/
async findHouseholdHealthMetrics(homeId) {
  try {
    logger.info(`Buscando métricas de salud para hogar ID: ${homeId}`);

    const persons = await Person.findAll({
      attributes: ['id', 'name', 'image'],
      include: [
        {
          model: Home,
          as: 'homePersons',
          where: { id: homeId },
          required: true,
        },
      ],
      raw: true,
      nest: true,
    });

    const personIds = persons.map(p => p.id);
    const personMap = new Map(persons.map(p => [p.id, { name: p.name, imageUrl: p.imageUrl }]));

    // Si no hay miembros, retornamos vacío
    if (personIds.length === 0) {
      return {
        totalMembers: 0,
        countNormalBloodPressure: 0,
        countHealthyWeight: 0,
        healthyWeightMembers: [],
        normalBloodPressureMembers: [],
      };
    }

    const sequelize = PhysicalExam.sequelize;

    // Helper para construir consultas seguras con replacements
    const buildQuery = (field) => `
      SELECT person_id, ${field}, exam_date
      FROM (
        SELECT person_id, ${field}, exam_date,
               ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY exam_date DESC) as rn
        FROM physical_exams
        WHERE person_id IN (${personIds.map(() => '?').join(',')})
          AND ${field} IS NOT NULL
      ) ranked
      WHERE rn = 1
    `;

    // Ejecutar queries con replacements (seguro contra inyección)
    const replacements = personIds;

    const lastBPExamsRaw = await sequelize.query(buildQuery('blood_pressure'), {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const lastWeightExamsRaw = await sequelize.query(buildQuery('weight'), {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const lastHeightExamsRaw = await sequelize.query(buildQuery('height'), {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    // Convertir a Map
    const bpMap = new Map(lastBPExamsRaw.map(exam => [exam.person_id, exam]));
    const weightMap = new Map(lastWeightExamsRaw.map(exam => [exam.person_id, exam]));
    const heightMap = new Map(lastHeightExamsRaw.map(exam => [exam.person_id, exam]));

    let countNormalBloodPressure = 0;
    let countHealthyWeight = 0;

    const healthyWeightMembers = [];
    const normalBloodPressureMembers = [];

    // Iterar sobre todos los miembros del hogar
    for (const person of persons) {
      const { id: personId, name, image } = person;

      // ───────────────────────────────
      // PRESIÓN ARTERIAL
      // ───────────────────────────────
      const bpExam = bpMap.get(personId);
      if (bpExam && bpExam.blood_pressure != null) {
        let systolic, diastolic;
        const rawBP = bpExam.blood_pressure;

        if (typeof rawBP === 'string') {
          const parts = rawBP.split('/').map(p => p.trim());
          systolic = parseInt(parts[0], 10);
          diastolic = parseInt(parts[1], 10);
        } else if (Array.isArray(rawBP)) {
          [systolic, diastolic] = rawBP.map(Number);
        } else if (typeof rawBP === 'object' && rawBP !== null) {
          systolic = Number(rawBP.systolic || rawBP.sys || rawBP.systolicValue || 0);
          diastolic = Number(rawBP.diastolic || rawBP.dia || rawBP.diastolicValue || 0);
        } else {
          systolic = Number(rawBP);
          diastolic = 0;
        }

        const isNormal = !isNaN(systolic) && !isNaN(diastolic) && systolic <= 120 && diastolic <= 80;

        normalBloodPressureMembers.push({
          name,
          image,
          bloodPressure: rawBP,
          isNormalBloodPressure: isNormal,
          hasData: true,
        });

        if (isNormal) countNormalBloodPressure++;
      } else {
        // ❌ No tiene datos de presión
        normalBloodPressureMembers.push({
          name,
          image,
          bloodPressure: null,
          isNormalBloodPressure: false,
          hasData: false,
        });
      }

      // ───────────────────────────────
      // PESO SALUDABLE (IMC)
      // ───────────────────────────────
      const weightExam = weightMap.get(personId);
      const heightExam = heightMap.get(personId);

      if (weightExam && heightExam) {
        const weight = parseFloat(weightExam.weight);
        const height = parseFloat(heightExam.height);

        if (!isNaN(weight) && !isNaN(height) && height > 0) {
          const bmi = weight / (height * height);
          const isHealthy = bmi >= 18.5 && bmi <= 24.9;

          healthyWeightMembers.push({
            name,
            image,
            weight,
            height,
            bmi: parseFloat(bmi.toFixed(2)),
            isHealthyWeight: isHealthy,
            hasData: true,
          });

          if (isHealthy) countHealthyWeight++;
        } else {
          // Datos inválidos (ej. altura = 0)
          healthyWeightMembers.push({
            name,
            image,
            weight: null,
            height: null,
            bmi: null,
            isHealthyWeight: false,
            hasData: false,
          });
        }
      } else {
        // ❌ Falta peso o altura
        healthyWeightMembers.push({
          name,
          image,
          weight: null,
          height: null,
          bmi: null,
          isHealthyWeight: false,
          hasData: false,
        });
      }
    }

    logger.info(`📊 RESULTADO FINAL:`);
    logger.info(`   Total de miembros: ${persons.length}`);
    logger.info(`   Presión arterial normal: ${countNormalBloodPressure}`);
    logger.info(`   Peso saludable: ${countHealthyWeight}`);

    return {
      totalMembers: persons.length,
      countNormalBloodPressure,
      countHealthyWeight,
      healthyWeightMembers,
      normalBloodPressureMembers,
    };

  } catch (error) {
    logger.error('PhysicalExamRepository->findHouseholdHealthMetrics:', error.message);
    throw new Error(`Error fetching household health metrics: ${error.message}`);
  }
}
};

module.exports = PhysicalExamRepository;