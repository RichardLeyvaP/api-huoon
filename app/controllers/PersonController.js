const path = require('path');
const fs = require('fs');
const { Person, User, sequelize } = require('../models');  // Importar el modelo Person
const logger = require('../../config/logger');
const i18n = require("../../config/i18n-config"); // Importar i18n para traducciones
const bcrypt = require('bcrypt');
const authConfig = require('../../config/auth');
const { PersonRepository, UserRepository, PhysicalExamRepository, MedicalExamRepository, TreatmentRepository, PersonalBackgroundRepository, FamilyBackgroundRepository, DiagnosisRepository } = require('../repositories');
const Module = require('module');

const PersonController = {

    async index(req, res) {
        logger.info(`${req.user.name} - Accediendo a la lista de personas`);

        try {
            // Cargar solo los campos necesarios
            const people = await PersonRepository.findAll();

            // Mapear los resultados solo si es necesario
            const mappedPeople = people.map(person => {
                return {
                  id: person.id,
                  userId: person.user_id,
                  name: person.name,
                  user: person.user.name,
                  language: person.user.language,
                  birthDate: person.birth_date,
                  age: person.age,
                  gender: person.gender,
                  email: person.email,
                  phone: person.phone,
                  address: person.address,
                  image: person.image,
                  emergencyContact: person.emergencyContact,
                    // Nuevos campos
                    medicalRecordNumber: person.medical_record_number,
                    documentType: person.document_type,
                    documentNumber: person.document_number,
                    healthCoverage: person.health_coverage,
                    coverageName: person.coverage_name,
                    blood_type: person.blood_type,
                    bloodType: person.blood_type,
                };
            });

            // Devolver los datos sin mapeo si no es necesario transformar los datos
            // res.status(200).json({ people }); 

            // Si hay transformación, devolver los datos mapeados
            res.status(200).json({ people: mappedPeople });

        } catch (error) {
            logger.error('Error en PersonController->index: ' + error.message);
            res.status(500).json({ error: 'ServerError' });
        }
    },
    
    async store(req, res) {
        logger.info(`${req.user.name} - Creando una nueva persona`);
        logger.info('datos recibidos al crear una persona');
        logger.info(JSON.stringify(req.body));

        let user;
        if (req.body.user_id !== undefined) {
            user = await UserRepository.findById(req.body.user_id);
            if (!user) {
                logger.error(`PersonController->store: Usuario no encontrado con ID ${req.body.user_id}`);
                return res.status(204).json({ msg: 'UserNotFound' });
            }
        }
        // Iniciar una transacción
        const t = await sequelize.transaction();
        try {
            if (!user) {
                logger.info('PersonController->store: Creando nuevo usuario');
                user = await UserRepository.create(req.body, t);
            }
           const person = await PersonRepository.create(req.body, req.file, user, t);
            
            // Confirmar la transacción
            await t.commit();
                // Si no hay archivo, responder con la persona creada
                return res.status(201).json({
                    msg: 'PersonCreated',
                    person: person
                });
    
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('Error en PersonController->store: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    
    async show(req, res) {
        logger.info(`${req.user.name} - Accediendo a buscar una persona`);
        
        try {
            // Buscar persona por ID
            // Usar findByPk si estás buscando por clave primaria (id)
            const person = await PersonRepository.findById(req.body.id);  // findByPk en lugar de findById
            if (!person) {
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
            // Mapear los resultados solo si es necesario
            const mappedPeople = {
                    id:person.id,
                    userId: person.user_id,
                    name: person.name,
                    user: person.user.name,
                    language: person.user.language,
                    birthDate: person.birth_date,
                    age: person.age,
                    gender: person.gender,
                    email: person.email,
                    phone: person.phone,
                    address: person.address,
                    image: person.image,
                    emergencyContact: person.emergencyContact,
                    // Nuevos campos
                    medicalRecordNumber: person.medical_record_number,
                    documentType: person.document_type,
                    documentNumber: person.document_number,
                    healthCoverage: person.health_coverage,
                    coverageName: person.coverage_name,
                    blood_type: person.blood_type,
                    bloodType: person.blood_type,
                };

            // Si hay transformación, devolver los datos mapeados
            res.status(200).json({ people: mappedPeople });

        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('PeopleController->show: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Editando una persona`);
        logger.info('datos recibidos al editar una persona');
        logger.info(JSON.stringify(req.body));
        
        // Buscar la persona por ID
        const person = await PersonRepository.findById(req.body.id);
        if (!person) {
            logger.error(`PeopleController->update: Persona no encontrada con ID ${req.body.id}`);
            return res.status(404).json({ msg: 'PersonNotFound' });
        }
        
        let userData;
        if (req.body.user_id) {
            userData = await UserRepository.findById(req.body.user_id);
            if (!userData) {
                logger.error(`PersonController->store: Usuario no encontrado con ID ${req.body.user_id}`);
                return res.status(204).json({ msg: 'UserNotFound' });
            }
        }else{
            userData = await UserRepository.findById(person.user_id);
        }

    // Iniciar una transacción
        const t = await sequelize.transaction();
       try {

        if (req.body.user || req.body.email || req.body.language) {
            logger.info('PersonController->update: editando el usuario');
            const body = {};
            if (req.body.user) body.name = req.body.user;
            if (req.body.language) body.language = req.body.language;
            if (req.body.email) body.email = req.body.email;
            const userDataUpdate = await UserRepository.update(userData, body, t);        
        }
            const personUpdate = await PersonRepository.update(person, req.body, req.file, t);
                // Confirmar la transacción
            await t.commit();
            res.status(200).json({ msg: 'PersonUpdated', personUpdate });
    
        } catch (error) {
            await t.rollback();
            // Capturar errores del bloque try y registrarlos
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error(`PeopleController->update: Error al actualizar la persona: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando una persona`);
        
        try {
            // Buscar la persona por ID
            const person = await PersonRepository.findById(req.body.id);
            if (!person) {
                logger.error(`PeopleController->destroy: Persona no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
    
            logger.info(`Persona eliminada exitosamente: ${person.name} (ID: ${person.id})`);
            const personDelete = await PersonRepository.delete(person);
            // Eliminar el usuario correspondiente si existe
        if (person.user) {
            logger.info(`Usuario asociado eliminado: ${person.user.name} (ID: ${person.user.id})`);
            const userDelete = await UserRepository.destroy(person.user);
        }
            res.status(200).json({ msg: 'PersonDeleted' });
    
        } catch (error) {
            // Capturar errores del bloque try y registrarlos
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error(`PeopleController->destroy: Error al eliminar la persona: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    
    async getCurrentLocalDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, 
    async getPersonProfile(req, res) {
        logger.info(`${req.user.name} - Accediendo al perfil de una persona`);
        
        try {
    
            const person_id = req.person.id;
            // Buscar persona por ID obtenido de req.person
            logger.info('comenzar a optener los datos');
            const person = await PersonRepository.findById(person_id);

            // Mapear los resultados
            const mappedPerson = {
                id: person.id,
                userId: person.user_id,
                name: person.name,
                user: person.user.name,
                language: person.user.language,
                birthDate: person.birth_date,
                age: person.age,
                gender: person.gender,
                email: person.email,
                phone: person.phone,
                address: person.address,
                image: person.image,
                emergencyContact: person.emergencyContact,
                medicalRecordNumber: person.medical_record_number,
                documentType: person.document_type,
                documentNumber: person.document_number,
                healthCoverage: person.health_coverage,
                coverageName: person.coverage_name,
                blood_type: person.blood_type,
                bloodType: person.blood_type,
                date: person.updatedAt ? 
                        `${person.updatedAt.getFullYear()}-${String(person.updatedAt.getMonth() + 1).padStart(2, '0')}-${String(person.updatedAt.getDate()).padStart(2, '0')}` : 
                        await this.getCurrentLocalDate(),
            };
            //Examen Fisico
            const physicalExam = await PhysicalExamRepository.getLastByPersonId(person_id);
            const mappedPhysicalExam = physicalExam ? {
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
            }: null;
            //Último examen medico
             const examMedicals = await MedicalExamRepository.findAllByPersonId(person_id);
             const mappedExam = examMedicals ? examMedicals.map((exam) => {
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
                       type: exam.type.name,
                       exam_name: exam.exam_name,
                       examName: exam.exam_name,
                       results: exam.results,
                       observations: exam.observations,
                       archive: exam.archive,
                     };
                   }) : null;
            //Último Tratamiento
            const treatment = await TreatmentRepository.getLastByPersonId(person_id);
            const mappedTreatment = treatment ? {
                id: treatment.id,
                personId: treatment.person_id,
                person_id: treatment.person_id,
                medicalConsultationId: treatment.medical_consultation_id,
                medical_consultation_id: treatment.medical_consultation_id,
                medication: treatment.medication,
                dosage: treatment.dosage,
                frequency: treatment.frequency,
                duration: treatment.duration,
                instructions: treatment.instructions,
                purpose: treatment.purpose,
                startDate: treatment.startDate,
                endDate: treatment.endDate,
            }: null;

            //Antecedentes personales
            const backgroundsPerson = await PersonalBackgroundRepository.findAllByPersonId(person_id);
            const mappedBackgroundsPerson = backgroundsPerson ? backgroundsPerson.map((background) => {
                    const translatedName = i18n.__(`types.${background.type?.name}.name`) !== `types.${background.type?.name}.name`
                      ? i18n.__(`types.${background.type?.name}.name`)
                      : background.type?.name;
            
                    return {
                      id: background.id,
                      type_id: background.type_id,
                      typeId: background.type_id,
                      description: background.description,
                      details: background.details,
                      startDate: background.startDate,
                      endDate: background.endDate,
                      status: background.status,
                      severity: background.severity,
                      personId: background.person_id,
                      person_id: background.person_id,
                      typeName: translatedName,
                      type: background.type?.name,
                    };
                  }): null;

            //Antecedentes FAmiliares
            const backgroundsFamily = await FamilyBackgroundRepository.findAllByPersonId(person_id);
            const mappedBackgroundsFamily = backgroundsFamily ? backgroundsFamily.map((background) => {
                    const translatedName = i18n.__(`types.${background.type?.name}.name`) !== `types.${background.type?.name}.name`
                      ? i18n.__(`types.${background.type?.name}.name`)
                      : background.type?.name;
            
                    return {
                      id: background.id,
                      type_id: background.type_id,
                      typeId: background.type_id,
                      relationship: background.relationship,
                      disease: background.disease,
                      details: background.details,
                      diagnosis_age: background.diagnosis_age,
                      personId: background.person_id,
                      person_id: background.person_id,
                      homeId: background.home_id,
                      home_id: background.home_id,
                      typeName: translatedName,
                      type: background.type?.name,
                      date: background.date,
                    };
                  }): null;

            //Diagnósticos
            const diagnosis = await DiagnosisRepository.getLastByPersonId(person_id);
            const mappedDiagnosis = diagnosis ? {
    // IDs y relaciones
                    id: diagnosis.id,
                    type_id: diagnosis.type_id,
                    typeId: diagnosis.type_id,
                    medical_consultation_id: diagnosis.medical_consultation_id,
                    medicalConsultationId: diagnosis.medical_consultation_id,
                    
                    // Información principal del diagnóstico
                    description: diagnosis.description,
                    cie10_code: diagnosis.cie10_code,
                    cie10Code: diagnosis.cie10_code,
                    notes: diagnosis.notes,
                    date: diagnosis.date,
                    
                    // Información del tipo (con traducción)
                    typeName: diagnosis.type?.name 
                        ? (i18n.__(`types.${diagnosis.type.name}.name`) !== `types.${diagnosis.type.name}.name`
                            ? i18n.__(`types.${diagnosis.type.name}.name`)
                            : diagnosis.type.name)
                        : null,
                    type: diagnosis.type?.name
                } : null;
            // Devolver los datos mapeados
            res.status(200).json({ person: mappedPerson, physicalExam: mappedPhysicalExam, medicalExam: mappedExam, treatment: mappedTreatment, backgroundPerson: mappedBackgroundsPerson, backgroundFamily: mappedBackgroundsFamily, diagnosis: mappedDiagnosis });

        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('PeopleController->getPersonProfile: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
};

module.exports = PersonController;
