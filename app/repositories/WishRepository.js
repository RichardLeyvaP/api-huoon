const { Op, fn, col, literal, Sequelize } = require("sequelize");
const {
  Wish,
  Priority,
  Status,
  Person,
  Home,
  sequelize,
} = require("../models"); // Importar los modelos necesarios
const i18n = require("../../config/i18n-config");
const logger = require("../../config/logger"); // Importa el logger

const WishRepository = {
  async findAll() {
    return await Wish.findAll({
      where: { parent_id: null }, // Solo deseos principales (sin padre)
      include: [
        { model: Priority, as: "priority" }, // Relación con Priority
        { model: Status, as: "status" }, // Relación con Status
        { model: Person, as: "person" }, // Relación con Person
        { model: Home, as: "home" }, // Relación con Home
        {
          model: Wish,
          as: "children", // Relación con subdeseos
          include: [
            { model: Priority, as: "priority" },
            { model: Status, as: "status" },
            { model: Person, as: "person" },
            { model: Home, as: "home" },
          ],
        },
      ],
    });
  },

  /*async findAllType(id, home_id = null, type) {
    const whereConditions = { parent_id: null};
    // Según el tipo, establecer el campo correcto para la consulta
    if (type === "Hogar") {
      whereConditions.type = type;
      whereConditions.home_id = id; // Si el tipo es 'Hogar', usa home_id
    } else if (type === "Personal" || type === "Profesional") {
      whereConditions.type = type;
      whereConditions.person_id = id; // Si el tipo es 'Persona', usa person_id
    } else {
      whereConditions[Op.or] = [
        { home_id: home_id, type: "Hogar" }, // Si home_id es igual al parámetro y type es 'Hogar'
        { person_id: id, type: "Personal" }, // Si person_id es igual al parámetro y type es 'Personal'
        { person_id: id, type: "Profesional" }, // Si person_id es igual al parámetro y type es 'Profesional'
      ];
    }
    return await Wish.findAll({
        where: whereConditions, // Solo deseos principales (sin padre)
        include: [
          { model: Priority, as: "priority" }, // Relación con Priority
          { model: Status, as: "status" }, // Relación con Status
          {
            model: Wish,
            as: "children", // Relación con subdeseos
            include: [
              { model: Priority, as: "priority" },
              { model: Status, as: "status" },
            ],
          },
        ],
      });
  },*/
  async findAllType(id, home_id = null, type, date = null) {
    const whereConditions = { parent_id: null };
    
    // Configuración según tipo
    if (type === "Hogar") {
      whereConditions.type = type;
      whereConditions.home_id = id;
    } else if (type === "Personal" || type === "Profesional") {
      whereConditions.type = type;
      whereConditions.person_id = id;
    } else {
      whereConditions[Op.or] = [
        { home_id: home_id, type: "Hogar" },
        { person_id: id, type: "Personal" },
        { person_id: id, type: "Profesional" },
      ];
    }

    // Manejo de fecha
    if (date) {
      // Opción 1: Comparación exacta (si el campo es DATE)
      // whereConditions.date = date;
      
      // Opción 2: Comparar solo la parte de fecha (si el campo es DATETIME)
      whereConditions[Op.and] = [
        Sequelize.where(Sequelize.fn('DATE', Sequelize.col('Wish.date')), '=', date),
        ...(whereConditions[Op.and] || [])
      ];
      
      // Opción 3: Rango de fechas (si necesitas todo el día)
      // whereConditions.date = {
      //   [Op.gte]: new Date(date + 'T00:00:00'),
      //   [Op.lte]: new Date(date + 'T23:59:59')
      // }
    }

    return await Wish.findAll({
      where: whereConditions,
      include: [
        { model: Priority, as: "priority" },
        { model: Status, as: "status" },
        {
          model: Wish,
          as: "children",
          include: [
            { model: Priority, as: "priority" },
            { model: Status, as: "status" },
          ],
        },
      ],
      order: [
        ['date', 'DESC'] // Opcional: ordenar por fecha descendente
      ]
    });
  },
  async mapChildren(children, personId) {
    try {
      return await Promise.all(
        children.map(async (child) => {
          return {
            id: child.id,
            name: child.name,
            description: child.description,
            type: child.type,
            date: child.date,
            end: child.end,
            location: child.location,
            priorityId: child.priority_id,
            priority: child.priority,
            statusId: child.status_id,
            status: child.status,
            personId: child.person_id,
            person: child.person,
            homeId: child.home_id,
            home: child.home,
            parentId: child.parent_id,
            children: child.children ? await this.mapChildren(child.children, personId) : [],
          };
        })
      );
    } catch (error) {
      logger.error("WishRepository->mapChildren", error.message);
      throw error;
    }
  },

  async findById(id) {
    return await Wish.findByPk(id, {
      include: [
        { model: Priority, as: "priority" },
        { model: Status, as: "status" },
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        {
          model: Wish,
          as: "children",
          include: [
            { model: Priority, as: "priority" },
            { model: Status, as: "status" },
            { model: Person, as: "person" },
            { model: Home, as: "home" },
          ],
        },
      ],
    });
  },

  async findAllDate(start_date, personId, homeId) {
    return await Wish.findAll({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("Wish.date")),
            start_date // Comparar solo la parte de la fecha
          ),
          { home_id: homeId }, // Filtrar por el hogar dado
          {
            [Op.or]: [
              { person_id: personId }, // Relación directa con la persona
              sequelize.literal(`EXISTS (
                            SELECT 1
                            FROM home_person_wish
                            WHERE home_person_wish.wish_id = Wish.id
                            AND home_person_wish.person_id = ${personId}
                        )`),
            ],
          },
        ],
      },
      include: [
        { model: Priority, as: "priority" },
        { model: Status, as: "status" },
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        {
          model: Wish,
          as: "children",
          include: [
            { model: Priority, as: "priority" },
            { model: Status, as: "status" },
            { model: Person, as: "person" },
            { model: Home, as: "home" },
          ],
        },
      ],
    });
  },

  async create(body, personId, t = null) {
    try {
      // Crear el deseo
      const wish = await Wish.create(
        {
          name: body.name,
          description: body.description,
          type: body.type,
          date: body.date,
          end: body.end,
          location: body.location,
          priority_id: body.priority_id,
          status_id: body.status_id,
          person_id: personId,
          home_id: body.home_id,
          parent_id: body.parent_id,
        },
        { transaction: t }
      );
      return wish;
    } catch (err) {
      logger.error(`Error en WishRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(wish, body, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "name",
      "description",
      "type",
      "date",
      "end",
      "location",
      "priority_id",
      "status_id",
      "parent_id",
    ];
    try {
      // Filtrar campos en req.body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Actualizar el deseo solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await wish.update(updatedData, { transaction: t });
        logger.info(`Wish actualizado exitosamente (ID: ${wish.id})`);
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en WishRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(wish, t = null) {
    return await wish.destroy({ transaction: t });
  },
};

module.exports = WishRepository;