const logger = require("../../config/logger");
const { PetRepository, CategoryRepository, HomeRepository, PersonRepository, PetTreatmentRepository, VetVisitRepository, CurrentMedicationRepository, PetDietRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");
const { sequelize, } = require("../models");
const { CategoryService } = require("../services");

const PetController = {
  /**
   * Obtener todas las mascotas
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todas las mascotas`);
    try {
      const pets = await PetRepository.findAll();

      if (!pets.length) {
        return res.status(204).json({ msg: "PetsNotFound", pets: [] });
      }

      const mappedPets = pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        categoryId: pet.category_id,
        category_id: pet.category_id,
        categoryName: pet.category?.name,
        categoryNameTranslated: pet.category?.name
          ? i18n.__(`categories.${pet.category.name}.name`) !== `categories.${pet.category.name}.name`
            ? i18n.__(`categories.${pet.category.name}.name`)
            : pet.category.name
          : null,
        breed: pet.breed,
        sex: pet.sex,
        age: pet.age,
        dateBirth: pet.date_birth,
        color: pet.color,
        microchip: pet.microchip,
        signs: pet.signs,
        type: pet.type,
        typeName: i18n.__(`typetask.${pet.type}.name`) !==
                      `typetask.${pet.type}.name`
                        ? i18n.__(`typetask.${pet.type}.name`)
                        : pet.type,
        homeId: pet.home_id,
        home_id: pet.home_id,
        homeName: pet.home?.name || null,
        personId: pet.person_id,
        personName: pet.person?.name || null,
        image: pet.image,
      }));

      return res.status(200).json({ pets: mappedPets });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("PetController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener una mascota por ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca una mascota por ID`);
    try {
      const { id } = req.params;
      const pet = await PetRepository.findById(id);

      if (!pet) {
        return res.status(204).json({ msg: "PetNotFound" });
      }

      const mappedPet = {
        id: pet.id,
        name: pet.name,
        categoryId: pet.category_id,
        categoryName: pet.category?.name,
        categoryNameTranslated: pet.category?.name
          ? i18n.__(`categories.${pet.category.name}.name`) !== `categories.${pet.category.name}.name`
            ? i18n.__(`categories.${pet.category.name}.name`)
            : pet.category.name
          : null,
        breed: pet.breed,
        sex: pet.sex,
        age: pet.age,
        dateBirth: pet.date_birth,
        color: pet.color,
        microchip: pet.microchip,
        signs: pet.signs,
        type: pet.type,
        typeName: i18n.__(`typetask.${pet.type}.name`) !==
                      `typetask.${pet.type}.name`
                        ? i18n.__(`typetask.${pet.type}.name`)
                        : pet.type,
        homeId: pet.home_id,
        homeName: pet.home?.name || null,
        personId: pet.person_id,
        personName: pet.person?.name || null,
        image: pet.image,
        createdAt: pet.createdAt,
        updatedAt: pet.updatedAt,
      };

      return res.status(200).json({ pet: mappedPet });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener mascotas por hogar
   */
  async getByHomeId(req, res) {
    logger.info(`${req.user.name} - Busca mascotas por hogar`);
    try {
      const { homeId } = req.params;

      // Validar que el hogar exista
      const home = await HomeRepository.findById(homeId);
      if (!home) {
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      const pets = await PetRepository.findByHomeId(homeId);

      if (!pets.length) {
        return res.status(204).json({ msg: "PetsNotFound", pets: [] });
      }

      const mappedPets = pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        categoryId: pet.category_id,
        categoryName: pet.category?.name,
        breed: pet.breed,
        sex: pet.sex,
        age: pet.age,
        dateBirth: pet.date_birth,
        color: pet.color,
        microchip: pet.microchip,
        signs: pet.signs,
        type: pet.type,
        personId: pet.person_id,
        personName: pet.person?.name || null,
        image: pet.image,
      }));

      return res.status(200).json({ pets: mappedPets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->getByHomeId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener mascotas por persona (dueño personal)
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca mascotas por persona`);
    try {
      const personId = req.person.id;
      const { home_id} = req.body;

      const pets = await PetRepository.findByPersonId(personId, home_id);

      if (!pets.length) {
        return res.status(204).json({ msg: "PetsNotFound", pets: [] });
      }

       const formatDateToYYYYMMDD = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0'); // 0-11 → 1-12
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
      const mappedPets = await Promise.all(
        pets.map(async (pet) => {
          // Traducciones seguras
          const categoryNameTranslated = pet.category?.name
            ? i18n.__(`categories.${pet.category.name}.name`) !== `categories.${pet.category.name}.name`
              ? i18n.__(`categories.${pet.category.name}.name`)
              : pet.category.name
            : null;

          const sexTranslated = i18n.__(`gender.${pet.sex}.name`) !== `gender.${pet.sex}.name`
            ? i18n.__(`gender.${pet.sex}.name`)
            : pet.sex;

          const typeName = i18n.__(`typetask.${pet.type}.name`) !== `typetask.${pet.type}.name`
            ? i18n.__(`typetask.${pet.type}.name`)
            : pet.type;

          return {
            id: pet.id,
            name: pet.name,
            categoryId: pet.category_id,
            category_id: pet.category_id,
            categoryName: pet.category?.name || null,
            categoryNameTranslated,
            breed: pet.breed,
            sex: pet.sex,
            sexTranslated,
            age: pet.age,
            dateBirth: pet.date_birth,
            date_birth: pet.date_birth,
            color: pet.color,
            microchip: pet.microchip,
            signs: pet.signs,
            type: pet.type,
            typeName,
            homeId: pet.home_id,
            home_id: pet.home_id,
            homeName: pet.home?.name || null,
            personId: pet.person_id,
            personName: pet.person?.name || null,
            image: pet.image,
          };
        })
      );
      const petIds = pets.map(p => p.id);
      const [
        vaccinationDetails,
        pendingControlDetails,
        vetVisitDetails
      ] = await Promise.all([
        PetTreatmentRepository.getVaccinationDetailsForPets(petIds),
        PetTreatmentRepository.getPendingControlDetailsForPets(petIds),
        VetVisitRepository.getUpcomingVetVisitDetailsForPets(petIds)
      ]);
      // Función auxiliar para agrupar por pet_id
      const groupByPetId = (records) => {
        const map = new Map();
        records.forEach(record => {
          if (!map.has(record.pet_id)) {
            map.set(record.pet_id, []);
          }
          map.get(record.pet_id).push(record);
        });
        return map;
      };

      const vaccinationMap = groupByPetId(vaccinationDetails);
      const pendingControlMap = groupByPetId(pendingControlDetails);
      const vetVisitMap = groupByPetId(vetVisitDetails);
      const upToDateVaccinations = mappedPets.map(pet => {
        const records = vaccinationMap.get(pet.id) || [];
        return {
          id: pet.id,
          name: pet.name,
          image: pet.image,
          vaccinations: records.map(r => ({
            id: r.id,
            name: r.name,
            date: formatDateToYYYYMMDD(r.date),
            next_date: formatDateToYYYYMMDD(r.next_date),
            notes: r.notes
          })),
          hasVaccinations: records.length > 0,
          totalVaccinations: records.length
        };
      });
      const pendingControls = mappedPets.map(pet => {
        const records = pendingControlMap.get(pet.id) || [];
        return {
          id: pet.id,
          name: pet.name,
          image: pet.image,
          controls: records.map(r => ({
            id: r.id,
            name: r.name,
            type: r.type, // vaccination o deworming
            date: formatDateToYYYYMMDD(r.date),
            next_date: formatDateToYYYYMMDD(r.next_date),
            notes: r.notes,
            dosage: r.dosage,
            unit: r.unit,
            type: r.type
          })),
          hasControls: records.length > 0,
          totalControls: records.length
        };
      });

      const upcomingVetVisits = mappedPets.map(pet => {
        const records = vetVisitMap.get(pet.id) || [];
        return {
          id: pet.id,
          name: pet.name,
          image: pet.image,
          vetVisits: records.map(r => ({
            id: r.id,
            vet_name: r.vet_name,
            date: formatDateToYYYYMMDD(r.date),
            next_date: formatDateToYYYYMMDD(r.next_date),
            clinic: r.clinic,
            reason: r.reason
          })),
          hasVetVisits: records.length > 0,
          totalVetVisits: records.length
        };
      });
      /*const [
        upToDateVaccinations,
        pendingControls,
        upcomingVetVisits
      ] = await Promise.all([
        PetTreatmentRepository.countPetsWithUpToDateVaccinations(petIds),
        PetTreatmentRepository.countPetsWithPendingControls(petIds),
        VetVisitRepository.countPetsWithUpcomingVetVisits(petIds)
      ]);*/
      return res.status(200).json({ 
        pets: mappedPets,       
        stats: {
        totalPets: mappedPets.length,
        upToDateVaccinations: upToDateVaccinations.filter(p => p.hasVaccinations).length,
        pendingControls: pendingControls.filter(p => p.hasControls).length,
        upcomingVetVisits: upcomingVetVisits.filter(p => p.hasVetVisits).length,
      },
      details: {
        upToDateVaccinations,
        pendingControls,
        upcomingVetVisits
      }  
      });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getByPetId(req, res) {
  logger.info(`${req.user.name} - Busca mascota por ID`);

  try {
    const personId = req.person.id;
    const { home_id, pet_id } = req.body || {}; // opcional, si aún lo necesitas

    // Buscar la mascota por ID y verificar que pertenece a la persona (y opcionalmente al hogar)
    const pet = await PetRepository.findById(pet_id);

    if (!pet) {
      return res.status(404).json({ error: "PetNotFound" });
    }

    // Función para formatear fechas (la reutilizamos)
    const formatDateToYYYYMMDD = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Obtener datos relacionados
    const treatments = await PetTreatmentRepository.findByPetId(pet.id);
    const vetVisits = await VetVisitRepository.findByPetId(pet.id);
    const currentMedications = await CurrentMedicationRepository.findByPetId(pet.id);
    const petDiets = await PetDietRepository.findByPetId(pet.id);

    // Filtrar y ordenar
    const vaccinations = treatments.filter((t) => t.type === 'vaccination');
    const dewormings = treatments.filter((t) => t.type === 'deworming');

    const sortedVaccinations = vaccinations.sort((a, b) => new Date(b.date) - new Date(a.date));
    const sortedDewormings = dewormings.sort((a, b) => new Date(b.date) - new Date(a.date));
    const sortedMedications = currentMedications.sort(
      (a, b) => new Date(b.start_date) - new Date(a.start_date)
    );
    const sortedDiets = petDiets.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Últimos registros
    const lastVaccination = sortedVaccinations[0] || null;
    const lastDeworming = sortedDewormings[0] || null;
    const lastVetVisit = vetVisits[0] || null;
    const lastMedication = sortedMedications[0] || null;
    const lastDiet = sortedDiets[0] || null;

    // Traducciones
    const categoryNameTranslated = pet.category?.name
      ? i18n.__(`categories.${pet.category.name}.name`) !== `categories.${pet.category.name}.name`
        ? i18n.__(`categories.${pet.category.name}.name`)
        : pet.category.name
      : null;

    const sexTranslated = i18n.__(`gender.${pet.sex}.name`) !== `gender.${pet.sex}.name`
      ? i18n.__(`gender.${pet.sex}.name`)
      : pet.sex;

    const typeName = i18n.__(`typetask.${pet.type}.name`) !== `typetask.${pet.type}.name`
      ? i18n.__(`typetask.${pet.type}.name`)
      : pet.type;

    // Construir objeto de respuesta
    const mappedPet = {
      id: pet.id,
      name: pet.name,
      categoryId: pet.category_id,
      category_id: pet.category_id,
      categoryName: pet.category?.name || null,
      categoryNameTranslated,
      breed: pet.breed,
      sex: pet.sex,
      sexTranslated,
      age: pet.age,
      dateBirth: pet.date_birth,
      date_birth: pet.date_birth,
      color: pet.color,
      microchip: pet.microchip,
      signs: pet.signs,
      type: pet.type,
      typeName,
      homeId: pet.home_id,
      home_id: pet.home_id,
      homeName: pet.home?.name || null,
      personId: pet.person_id,
      personName: pet.person?.name || null,
      image: pet.image,

      vaccinations: {
        name: lastVaccination?.name || null,
        date: lastVaccination?.date || null,
        count: vaccinations.length,
      },

      dewormings: {
        name: lastDeworming?.name || null,
        date: lastDeworming?.date || null,
        count: dewormings.length,
      },

      vetvisits: {
        name: lastVetVisit?.reason || null,
        date: lastVetVisit?.date || null,
        count: vetVisits.length,
      },

      medications: {
        name: lastMedication?.name || null,
        date: lastMedication?.start_date || null,
        count: currentMedications.length,
      },

      diets: {
        name: lastDiet?.name || null,
        date: lastDiet ? formatDateToYYYYMMDD(lastDiet.createdAt) : null,
        count: petDiets.length,
      },
    };

    return res.status(200).json({ pet: mappedPet });

  } catch (error) {
    const errorMsg = error.message || "Error desconocido";
    logger.error("PetController->getByPetId: " + errorMsg);
    res.status(500).json({ error: "ServerError", details: errorMsg });
  }
},
  /**
   * Obtener mascotas por tipo (Personal o Hogar)
   */
  async getByType(req, res) {
    logger.info(`${req.user.name} - Busca mascotas por tipo`);
    try {
      const { type } = req.params;
      if (!["Personal", "Hogar"].includes(type)) {
        return res.status(400).json({ msg: "InvalidPetType" });
      }

      const pets = await PetRepository.findByFilters({ type });

      if (!pets.length) {
        return res.status(204).json({ msg: "PetsNotFound", pets: [] });
      }

      const mappedPets = pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        categoryId: pet.category_id,
        categoryName: pet.category?.name,
        breed: pet.breed,
        sex: pet.sex,
        age: pet.age,
        dateBirth: pet.date_birth,
        color: pet.color,
        microchip: pet.microchip,
        signs: pet.signs,
        type: pet.type,
        homeId: pet.home_id,
        homeName: pet.home?.name || null,
        personId: pet.person_id,
        personName: pet.person?.name || null,
        image: pet.image,
      }));

      return res.status(200).json({ pets: mappedPets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->getByType: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener mascotas por especie (category_id)
   */
  async getByCategoryId(req, res) {
    logger.info(`${req.user.name} - Busca mascotas por especie (categoría)`);
    try {
      const { categoryId } = req.params;

      const category = await CategoryRepository.findById(categoryId);
      if (!category) {
        return res.status(404).json({ msg: "CategoryNotFound" });
      }

      const pets = await PetRepository.findByFilters({ category_id: categoryId });

      if (!pets.length) {
        return res.status(204).json({ msg: "PetsNotFound", pets: [] });
      }

      const mappedPets = pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        breed: pet.breed,
        sex: pet.sex,
        age: pet.age,
        dateBirth: pet.date_birth,
        color: pet.color,
        microchip: pet.microchip,
        signs: pet.signs,
        type: pet.type,
        homeId: pet.home_id,
        homeName: pet.home?.name || null,
        personId: pet.person_id,
        personName: pet.person?.name || null,
        image: pet.image,
      }));

      return res.status(200).json({ pets: mappedPets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->getByCategoryId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear una nueva mascota
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva mascota`);
    logger.info("Datos recibidos al crear un amascota:");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {
  
      const { category_id, home_id} = req.body;

      req.body.person_id = req.person.id;

      // Verificar que la categoría exista
      const category = await CategoryRepository.findById(category_id);
      if (!category) {
        await transaction.rollback();
        logger.error(`Categoría no encontrada con ID ${category_id}`);
        return res.status(404).json({ msg: "CategoryNotFound" });
      }

      // Validar home_id si se proporciona
      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          logger.error(`Hogar no encontrado con ID ${home_id}`);
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      // Crear mascota
      const pet = await PetRepository.create(req.body, req.file, transaction);
      await transaction.commit();

      res.status(201).json({ pet });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar una mascota existente
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza mascota con ID ${req.body.id}`);
    logger.info("Datos recibidos al editar una mascota:");
    logger.info(JSON.stringify(req.body));

    const transaction = await sequelize.transaction();
    try {
      const { id, category_id, home_id, person_id } = req.body;

      const pet = await PetRepository.findById(id);
      if (!pet) {
        return res.status(404).json({ msg: "PetNotFound" });
      }

      // Validar categoría
      if (category_id) {
        const category = await CategoryRepository.findById(category_id);
        if (!category) {
          await transaction.rollback();
          return res.status(404).json({ msg: "CategoryNotFound" });
        }
      }

      // Validar hogar
      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          await transaction.rollback();
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      // Validar persona
      if (person_id) {
        const person = await PersonRepository.findById(person_id);
        if (!person) {
          await transaction.rollback();
          return res.status(404).json({ msg: "PersonNotFound" });
        }
      }

      // Actualizar
      const updatedPet = await PetRepository.update(pet, req.body, req.file, transaction);
      await transaction.commit();

      res.status(200).json({ pet: updatedPet });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar una mascota
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina mascota con ID ${req.body.id}`);

    const { id } = req.body;
    const transaction = await Pet.sequelize.transaction();

    try {
      const pet = await PetRepository.findById(id);
      if (!pet) {
        return res.status(404).json({ msg: "PetNotFound" });
      }

      await PetRepository.delete(pet, transaction);
      await transaction.commit();

      res.status(200).json({ msg: "PetDeleted" });
    } catch (error) {
      await transaction.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("PetController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Datos para formulario: categorías, tipos, etc.
   */
  async formOptions(req, res) {
    logger.info(`${req.user.name} - Solicita opciones para formulario de mascotas`);

    try {
      // Categorías de mascotas (especies)
      const categories = await CategoryRepository.findAll();
      const formattedCategories = categories.map((cat) => ({
        ...cat.toJSON(),
        nameTranslated: i18n.__(`categories.${cat.name}.name`) !== `categories.${cat.name}.name`
          ? i18n.__(`categories.${cat.name}.name`)
          : cat.name,
      }));

      // Tipos de mascota
      const petTypes = [
        { id: "Personal", name: "Personal", description: "Mascota personal" },
        { id: "Hogar", name: "Hogar", description: "Mascota del hogar" },
      ];

      const translatedTypes = petTypes.map((t) => ({
        id: t.id,
        name: i18n.__(`petTypes.${t.id}.name`) !== `petTypes.${t.id}.name`
          ? i18n.__(`petTypes.${t.id}.name`)
          : t.name,
        description: i18n.__(`petTypes.${t.id}.description`) !== `petTypes.${t.id}.description`
          ? i18n.__(`petTypes.${t.id}.description`)
          : t.description,
      }));

      // Sexos
      const sexOptions = [
        { id: "male", name: "Macho" },
        { id: "female", name: "Hembra" },
        { id: "other", name: "Otro" },
      ];

      return res.status(200).json({
        categories: formattedCategories,
        types: translatedTypes,
        sexOptions,
      });
    } catch (error) {
      logger.error("PetController->formOptions: " + error.message);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },
  async category_pets(req, res) {
    logger.info(`${req.user.name} - Entra a la ruta unificada de presupuesto`);
    // Verificar si el hogar existe
    /*const home = await HomeRepository.findById(req.body.home_id);
    if (!home) {
      logger.error(
        `TaskController->category_status_priority: Hogar no encontrado con ID ${req.body.home_id}`
      );
      return res.status(400).json({ msg: "HomeNotFound" });
    }*/

    // Obtén el ID de la persona autenticada
    const personId = req.person.id;
    // Establecer el idioma de i18n dinámicamente
    if (!personId) {
      return res.status(400).json({ error: "Persona no encontrada" });
    }
    try {
      const categories = await CategoryService.getCategories(personId, "Pets"); //const categories = await TaskController.getCategories(personId);
     const financeTypeData = [
             { id: "Personal", name: "Personal", description: "Registro financiero personal" },
             { id: "Hogar", name: "Hogar", description: "Registro financiero del hogar" }
               ];
     
               const translatedFinanceTypeData = financeTypeData.map((item) => ({
             id: item.id,
             name: i18n.__(`financeType.${item.id}.name`) !== `financeType.${item.id}.name`
                   ? i18n.__(`financeType.${item.id}.name`)
                   : item.name,
             description: i18n.__(`financeType.${item.id}.description`) !== `financeType.${item.id}.description`
                   ? i18n.__(`financeType.${item.id}.description`)
                   : item.description,
             originalName: item.name
           }));
      res.json({
        categories: categories,
        types: translatedFinanceTypeData,
      });
    } catch (error) {
      logger.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías" });
    }
  },
};

module.exports = PetController;