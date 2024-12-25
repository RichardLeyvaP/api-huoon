'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Person extends Model {
    /**
     * Método para definir asociaciones.
     */
    static associate(models) {
      // Relación belongsTo con el modelo User
      Person.belongsTo(models.User, {
        foreignKey: 'user_id', // Clave foránea en la tabla Person
        as: 'user',
        onDelete: 'CASCADE' // Eliminar persona si se elimina el usuario
      });

      // Relación belongsToMany con Category a través de CategoryPerson
      Person.belongsToMany(models.Category, {
        through: models.CategoryPerson, // Tabla intermedia
        foreignKey: 'person_id', // Clave foránea en CategoryPerson
        otherKey: 'category_id', // Clave foránea en CategoryPerson
        as: 'categories', // Alias para acceder a las categorías de la persona
      });

      Person.belongsToMany(models.Home, {
        through: 'home_person',
        foreignKey: 'person_id',
        otherKey: 'home_id',
        as: 'homes',  // Alias para la relación
      });

       // Relación belongsToMany con Task a través de PersonTask
       Person.belongsToMany(models.Task, {
        through: models.HomePersonTask,
        foreignKey: 'person_id',
        otherKey: 'task_id',
        as: 'assignedPeople',
        });

        Person.belongsToMany(models.Warehouse, {
          through: models.PersonWarehouse,
          foreignKey: 'person_id',
          otherKey: 'warehouse_id',
          as: 'warehouses',
          });
        Person.hasMany(models.HomePersonTask, { foreignKey: 'person_id', as: 'homePersonTasks', onDelete: 'CASCADE' });
        Person.hasMany(models.HomePerson, { foreignKey: 'person_id', as: 'homePeople', onDelete: 'CASCADE' });
        Person.hasMany(models.PersonHomeWarehouseProduct, { foreignKey: 'person_id', as: 'homeWarehouseProducts', onDelete: 'CASCADE' });
        Person.hasMany(models.Task, { foreignKey: 'person_id', as: 'tasks', onDelete: 'CASCADE' });
    }

    /**
     * Método para encontrar a la persona por user_id
     */
    static async findByUserId(userId) {
      try {
        return await this.findOne({
          where: { user_id: userId },
          include: [{ association: 'user' }],
        });
      } catch (error) {
        console.error("Error en findByUserId: ", error);
        throw error;
      }
    }
  }

  Person.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Person',
    tableName: 'people', // Asegúrate de que el nombre de la tabla sea correcto
    timestamps: true, // Si deseas incluir createdAt y updatedAt
  });
  return Person;
};