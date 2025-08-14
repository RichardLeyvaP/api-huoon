// controllers/petDiet.controller.js
const logger = require("../../config/logger");
const { 
  PetDietRepository, 
  PetRepository, 
  TypeRepository, 
  HomeRepository, 
  PersonRepository 
} = require("../repositories");
const i18n = require("../../config/i18n-config");
const { sequelize } = require("../models");

const PetDietController = {
  /**
   * Obtener todas las dietas
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todas las dietas de mascotas`);
    try {
      const diets = await PetDietRepository.findAll();

      if (!diets.length) {
        return res.status(204).json({ msg: "PetDietsNotFound", diets: [] });
      }

      const mappedDiets = diets.map(d => ({
        id: d.id,
        pet_id: d.pet_id,
        petName: d.pet?.name || null,
        name: d.name,
        food_type: d.food_type,
        foodTypeTranslated: d.food_type
            ? i18n.__(`foodTypes.${d.food_type}.name`) !== `foodTypes.${d.food_type}.name`
              ? i18n.__(`foodTypes.${d.food_type}.name`)
              : d.food_type
            : null,
        brand: d.brand,
        portion_size: d.portion_size,
        unit: d.unit,
        type_id: d.type?.id || null,
        typeName: d.type?.name || null,
        nameTranslated: d.type?.name
            ? i18n.__(`types.${d.type.name}.name`) !== `types.${d.type.name}.name`
              ? i18n.__(`types.${d.type.name}.name`)
              : d.type.name
            : null,
        special_instructions: d.special_instructions,
        home_id: d.home_id,
        homeName: d.home?.name || null,
        person_id: d.person_id,
        personName: d.person?.name || null,
      }));

      return res.status(200).json({ diets: mappedDiets });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map(d => d.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PetDietController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener una dieta por ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca dieta de mascota por ID`);
    try {
      const { id } = req.params;

      const { error } = idPetDietSchema.validate({ id });
      if (error) {
        return res.status(400).json({
          error: "ValidationError",
          details: error.details.map(d => d.message)
        });
      }

      const diet = await PetDietRepository.findById(id);

      if (!diet) {
        return res.status(204).json({ msg: "PetDietNotFound" });
      }

      const mappedDiet = {
        id: diet.id,
        pet_id: diet.pet_id,
        petName: diet.pet?.name || null,
        name: diet.name,
        food_type: diet.food_type,
        foodTypeTranslated: diet.food_type
            ? i18n.__(`foodTypes.${diet.food_type}.name`) !== `foodTypes.${diet.food_type}.name`
              ? i18n.__(`foodTypes.${diet.food_type}.name`)
              : diet.food_type
            : null,
        brand: diet.brand,
        portion_size: diet.portion_size,
        unit: diet.unit,
        type_id: diet.type?.id || null,
        typeName: diet.type?.name || null,
        nameTranslated: diet.type?.name
            ? i18n.__(`types.${diet.type.name}.name`) !== `types.${diet.type.name}.name`
              ? i18n.__(`types.${diet.type.name}.name`)
              : diet.type.name
            : null,
        special_instructions: diet.special_instructions,
        home_id: diet.home_id,
        homeName: diet.home?.name || null,
        person_id: diet.person_id,
        personName: diet.person?.name || null,
        createdAt: diet.createdAt,
        updatedAt: diet.updatedAt,
      };

      return res.status(200).json({ diet: mappedDiet });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetDietController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener dietas por mascota
   */
  async getByPetId(req, res) {
    logger.info(`${req.user.name} - Busca dieta por mascota`);
    try {
      const { pet_id } = req.body;

      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        return res.status(404).json({ msg: "PetNotFound" });
      }

      const diets = await PetDietRepository.findByPetId(pet_id);

      if (!diets.length) {
        return res.status(204).json({ msg: "PetDietsNotFound", diets: [] });
      }

      const mappedDiets = diets.map(d => ({
        id: d.id,
        name: d.name,
        food_type: d.food_type,
        foodTypeTranslated: d.food_type
            ? i18n.__(`foodTypes.${d.food_type}.name`) !== `foodTypes.${d.food_type}.name`
              ? i18n.__(`foodTypes.${d.food_type}.name`)
              : d.food_type
            : null,
        brand: d.brand,
        portion_size: d.portion_size,
        unit: d.unit,
       type_id: d.type?.id || null,
        typeName: d.type?.name || null,
        nameTranslated: d.type?.name
            ? i18n.__(`types.${d.type.name}.name`) !== `types.${d.type.name}.name`
              ? i18n.__(`types.${d.type.name}.name`)
              : d.type.name
            : null,
        special_instructions: d.special_instructions,
        person_id: d.person_id,
        personName: d.person?.name || null,
      }));

      return res.status(200).json({ diets: mappedDiets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetDietController->getByPetId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear una nueva dieta
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva dieta para mascota`);
    logger.info("Datos recibidos al crear una dieta:");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {
        req.body.person_id = req.person.id
      const { pet_id, type_id, home_id } = req.body;

      const pet = await PetRepository.findById(pet_id);
      if (!pet) {
        await transaction.rollback();
        return res.status(404).json({ msg: "PetNotFound" });
      }

      const frequencyType = await TypeRepository.findById(type_id);
      if (!frequencyType) {
        await transaction.rollback();
        return res.status(404).json({ msg: "TypeNotFound" });
      }

      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      const diet = await PetDietRepository.create(req.body, transaction);
      await transaction.commit();

      res.status(201).json({ diet });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetDietController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar una dieta
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza dieta con ID ${req.body.id}`);
    logger.info("Datos recibidos al editar una dieta:");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {
      const { id, pet_id, type_id, home_id, person_id } = req.body;

      const diet = await PetDietRepository.findById(id);
      if (!diet) {
        return res.status(404).json({ msg: "PetDietNotFound" });
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

      if (person_id) {
        const person = await PersonRepository.findById(person_id);
        if (!person) {
          await transaction.rollback();
          return res.status(404).json({ msg: "PersonNotFound" });
        }
      }

      const updatedDiet = await PetDietRepository.update(diet, req.body, transaction);
      await transaction.commit();

      res.status(200).json({ diet: updatedDiet });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetDietController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar una dieta
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina dieta con ID ${req.body.id}`);

    const { id } = req.body;
    const transaction = await sequelize.transaction();

    try {

      const diet = await PetDietRepository.findById(id);
      if (!diet) {
        return res.status(404).json({ msg: "PetDietNotFound" });
      }

      await PetDietRepository.delete(diet, transaction);
      await transaction.commit();

      res.status(200).json({ msg: "PetDietDeleted" });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetDietController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Opciones para formulario
   */
  async formOptions(req, res) {
    logger.info(`${req.user.name} - Solicita opciones para dieta de mascotas`);

    try {
      const pets = await PetRepository.findAll();
      const frequencies = await TypeRepository.findByType('FeedingFrequency'); // Asume que el campo `type` es 'FeedingFrequency'
      const homes = await HomeRepository.findAll();
      const persons = await PersonRepository.findAll();

      return res.status(200).json({
        pets: pets.map(p => ({ id: p.id, name: p.name })),
        frequencies: frequencies.map(t => ({
          id: t.id,
          name: i18n.__(`feedingFrequencies.${t.name}.name`) !== `feedingFrequencies.${t.name}.name`
            ? i18n.__(`feedingFrequencies.${t.name}.name`)
            : t.name
        })),
        homes: homes.map(h => ({ id: h.id, name: h.name })),
        persons: persons.map(p => ({ id: p.id, name: p.name, email: p.email }))
      });
    } catch (error) {
      logger.error("PetDietController->formOptions: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  async getTypesByFood(req, res) {
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
  
       const foodTypesData = [
        { id: "Seco", name: "Seco", description: "Alimento seco/croquetas" },
        { id: "Humedo", name: "Húmedo", description: "Alimento enlatado o en sobres" },
        { id: "RecetaMedica", name: "Receta médica", description: "Alimento formulado para condiciones específicas" },
        { id: "Natural", name: "Natural", description: "Dieta casera o alimentos naturales" },
        { id: "Snacks", name: "Snacks", description: "Premios o golosinas para mascotas" }
      ];

      const translatedFoodTypes = foodTypesData.map((item) => ({
        id: item.id, // Mantenemos el ID en español sin tildes
        name: i18n.__(`foodTypes.${item.id}.name`) !== `foodTypes.${item.id}.name`
          ? i18n.__(`foodTypes.${item.id}.name`)
          : item.name,
        description: i18n.__(`foodTypes.${item.id}.description`) !== `foodTypes.${item.id}.description`
          ? i18n.__(`foodTypes.${item.id}.description`)
          : item.description
      }));
        
        return res.status(200).json({ types: formattedTypes, foods: translatedFoodTypes });
      } catch (error) {
        const errorMsg = error.details
          ? error.details.map((detail) => detail.message).join(", ")
          : error.message || "Error desconocido";
        logger.error("PetDietController->getTypesByFoodType: " + errorMsg);
        res.status(500).json({ error: "ServerError", details: errorMsg });
      }
    },
};

module.exports = PetDietController;