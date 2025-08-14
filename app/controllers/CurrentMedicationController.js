// controllers/currentMedication.controller.js
const logger = require("../../config/logger");
const { 
  CurrentMedicationRepository, 
  PetRepository, 
  TypeRepository, 
  HomeRepository, 
  PersonRepository 
} = require("../repositories");
const i18n = require("../../config/i18n-config");
const { sequelize } = require("../models");

const CurrentMedicationController = {
  /**
   * Obtener todos los medicamentos en curso
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todos los medicamentos en curso`);
    try {
      const medications = await CurrentMedicationRepository.findAll();

      if (!medications.length) {
        return res.status(204).json({ msg: "CurrentMedicationsNotFound", medications: [] });
      }

      const mappedMedications = medications.map(m => ({
        id: m.id,
        pet_id: m.pet_id,
        petName: m.pet?.name || null,
        name: m.name,
        dosage: m.dosage,
        unit: m.unit,
        type_id: m.type_id,
        typeName: m.type?.name || null,
        typeNameTranslated: m.type?.name
          ? i18n.__(`types.${m.type.name}.name`) !== `types.${m.type.name}.name`
            ? i18n.__(`types.${m.type.name}.name`)
            : m.type.name
          : null,
        route: m.route,
        start_date: m.start_date,
        end_date: m.end_date,
        notes: m.notes,
        prescribed_by: m.prescribed_by,
        home_id: m.home_id,
        homeName: m.home?.name || null,
        person_id: m.person_id,
        personName: m.person?.name || null,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));

      return res.status(200).json({ medications: mappedMedications });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((d) => d.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("CurrentMedicationController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener un medicamento por ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca un medicamento en curso por ID`);
    try {
      const { id } = req.params;

      const { error } = idCurrentMedicationSchema.validate({ id });
      if (error) {
        return res.status(400).json({
          error: "ValidationError",
          details: error.details.map(d => d.message)
        });
      }

      const med = await CurrentMedicationRepository.findById(id);

      if (!med) {
        return res.status(204).json({ msg: "CurrentMedicationNotFound" });
      }

      const mappedMed = {
        id: med.id,
        pet_id: med.pet_id,
        petName: med.pet?.name || null,
        name: med.name,
        dosage: med.dosage,
        unit: med.unit,
        type_id: med.type_id,
        typeName: med.type?.name || null,
        typeNameTranslated: med.type?.name
          ? i18n.__(`types.${med.type.name}.name`) !== `types.${med.type.name}.name`
            ? i18n.__(`types.${med.type.name}.name`)
            : med.type.name
          : null,
        route: med.route,
        start_date: med.start_date,
        end_date: med.end_date,
        notes: med.notes,
        prescribed_by: med.prescribed_by,
        home_id: med.home_id,
        homeName: med.home?.name || null,
        person_id: med.person_id,
        personName: med.person?.name || null,
      };

      return res.status(200).json({ medication: mappedMed });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("CurrentMedicationController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener medicamentos por mascota
   */
  async getByPetId(req, res) {
    logger.info(`${req.user.name} - Busca medicamentos por mascota`);
    try {
      const { pet_id } = req.body;

      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        return res.status(404).json({ msg: "PetNotFound" });
      }

      const medications = await CurrentMedicationRepository.findByPetId(pet_id);

      const mappedMedications = medications.map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        unit: m.unit,
        type_id: m.type_id,
        typeName: m.type?.name || null,
        typeNameTranslated: m.type?.name
          ? i18n.__(`types.${m.type.name}.name`) !== `types.${m.type.name}.name`
            ? i18n.__(`types.${m.type.name}.name`)
            : m.type.name
          : null,
        route: m.route,
        start_date: m.start_date,
        end_date: m.end_date,
        notes: m.notes,
        prescribed_by: m.prescribed_by,
        person_id: m.person_id,
        personName: m.person?.name || null,
      }));

      return res.status(200).json({ medications: mappedMedications });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("CurrentMedicationController->getByPetId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener medicamentos activos
   */
  async getActive(req, res) {
    logger.info(`${req.user.name} - Busca medicamentos activos`);
    try {
      const medications = await CurrentMedicationRepository.findActive();

      if (!medications.length) {
        return res.status(204).json({ msg: "ActiveMedicationsNotFound", medications: [] });
      }

      const mappedMedications = medications.map(m => ({
        id: m.id,
        petName: m.pet?.name || null,
        name: m.name,
        dosage: m.dosage,
        unit: m.unit,
        route: m.route,
        start_date: m.start_date,
        end_date: m.end_date,
        prescribed_by: m.prescribed_by,
      }));

      return res.status(200).json({ medications: mappedMedications });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("CurrentMedicationController->getActive: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear un nuevo medicamento en curso
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo medicamento en curso`);
    logger.info("Datos recibidos al crear un medicamento en curso:");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {

      const { pet_id, type_id, home_id } = req.body;

      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        await transaction.rollback();
        return res.status(404).json({ msg: "PetNotFound" });
      }

      if (type_id) {
        const type = await TypeRepository.findById(type_id);
        if (!type) {
          await transaction.rollback();
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      const medication = await CurrentMedicationRepository.create(req.body, transaction);
      await transaction.commit();

      res.status(201).json({ medication });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("CurrentMedicationController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar un medicamento
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza medicamento en curso con ID ${req.body.id}`);
    logger.info("Datos recibidos al editar un medicamento en curso:");
    logger.info(JSON.stringify(req.body));
    const transaction = await sequelize.transaction();
    try {
      const { id, pet_id, type_id, home_id } = req.body;

      const medication = await CurrentMedicationRepository.findById(id);
      if (!medication) {
        return res.status(404).json({ msg: "CurrentMedicationNotFound" });
      }

      if (pet_id) {
        const pet = await PetRepository.findById(pet_id);
        if (!pet) {
          await transaction.rollback();
          return res.status(404).json({ msg: "PetNotFound" });
        }
      }

      if (type_id) {
        const type = await TypeRepository.findById(type_id);
        if (!type) {
          await transaction.rollback();
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      const updatedMedication = await CurrentMedicationRepository.update(medication, req.body, transaction);
      await transaction.commit();

      res.status(200).json({ medication: updatedMedication });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("CurrentMedicationController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar un medicamento
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina medicamento en curso con ID ${req.body.id}`);

    const { id } = req.body;
    const transaction = await sequelize.transaction();

    try {

      const medication = await CurrentMedicationRepository.findById(id);
      if (!medication) {
        return res.status(404).json({ msg: "CurrentMedicationNotFound" });
      }

      await CurrentMedicationRepository.delete(medication, transaction);
      await transaction.commit();

      res.status(200).json({ msg: "CurrentMedicationDeleted" });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("CurrentMedicationController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Opciones para formulario
   */
  async formOptions(req, res) {
    logger.info(`${req.user.name} - Solicita opciones para medicamentos`);

    try {
      const pets = await PetRepository.findAll();
      const types = await TypeRepository.findByType('Medication'); // Asumiendo que tienes un campo `type` en Type
      const homes = await HomeRepository.findAll();
      const persons = await PersonRepository.findAll();

      return res.status(200).json({
        pets: pets.map(p => ({ id: p.id, name: p.name })),
        types: types.map(t => ({
          id: t.id,
          name: i18n.__(`types.${t.name}.name`) !== `types.${t.name}.name`
            ? i18n.__(`types.${t.name}.name`)
            : t.name
        })),
        homes: homes.map(h => ({ id: h.id, name: h.name })),
        persons: persons.map(p => ({ id: p.id, name: p.name, email: p.email })),
        routes: ['oral', 'inyectable', 'tópica', 'subcutánea', 'intravenosa'].map(r => ({ id: r, name: r }))
      });
    } catch (error) {
      logger.error("CurrentMedicationController->formOptions: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  async getTypesByRoutes(req, res) {
      logger.info(`${req.user.name} - Buscando tipos de tipo ${req.body.type}`);
  
      try {
        const { type } = req.body; // Supongamos que el tipo viene en el cuerpo de la solicitud
        const types = await TypeRepository.findByType(type);
  
        if (!types || types.length === 0) {
          return res
            .status(404)
            .json({
              message: "No se encontraron tipos para el tipo especificado.",
            });
        }
  
        // Formatear los resultados para traducir name y description
        const formattedTypes = types.map((typeItem) => {
          const translatedName = i18n.__(`types.${typeItem.name}.name`) !==
                `types.${typeItem.name}.name`
                ? i18n.__(`types.${typeItem.name}.name`)
                : typeItem.name;
  
          const translatedDescription = i18n.__(`types.${typeItem.name}.name`) !==
                `types.${typeItem.name}.name`
                ? i18n.__(`types.${typeItem.name}.description`)
                : typeItem.description;
  
          return {
            ...typeItem.toJSON(), // Mantener todos los campos originales
            nameTranslated: translatedName, // Sobrescribir name con la traducción
            descriptionTranslated: translatedDescription, // Sobrescribir description con la traducción
          };
        });
  
        const administrationRoutesData = [
        { id: "Oral", name: "Oral", description: "Vía de administración por boca" },
        { id: "Sublingual", name: "Sublingual", description: "Bajo la lengua" },
        { id: "Topica", name: "Tópica", description: "Aplicación en piel o mucosas" },
        { id: "Inyectable", name: "Inyectable", description: "Por vía inyectable" },
        { id: "Rectal", name: "Rectal", description: "Por vía rectal (supositorios)" },
        { id: "Otica", name: "Ótica", description: "En el oído" },
        { id: "Nasal", name: "Nasal", description: "Por vía nasal (sprays, gotas)" }
      ];
  
        const translatedRoutes = administrationRoutesData.map((item) => ({
        id: item.id, // Mantenemos el ID en español
        name: i18n.__(`administrationRoutes.${item.id}.name`) !== `administrationRoutes.${item.id}.name`
          ? i18n.__(`administrationRoutes.${item.id}.name`)
          : item.name,
        description: i18n.__(`administrationRoutes.${item.id}.description`) !== `administrationRoutes.${item.id}.description`
          ? i18n.__(`administrationRoutes.${item.id}.description`)
          : item.description
      }));
        
        return res.status(200).json({ types: formattedTypes, routes: translatedRoutes });
      } catch (error) {
        const errorMsg = error.details
          ? error.details.map((detail) => detail.message).join(", ")
          : error.message || "Error desconocido";
        logger.error("TypeController->getTypesByType: " + errorMsg);
        res.status(500).json({ error: "ServerError", details: errorMsg });
      }
    },
};

module.exports = CurrentMedicationController;