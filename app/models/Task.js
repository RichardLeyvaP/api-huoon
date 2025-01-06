'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Task.belongsTo(models.Priority, { foreignKey: 'priority_id', as: 'priority', onDelete: 'CASCADE' });
      Task.belongsTo(models.Status, { foreignKey: 'status_id', as: 'status', onDelete: 'CASCADE' });
      Task.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category', onDelete: 'CASCADE' });
      Task.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' });
      Task.belongsTo(models.Home, { foreignKey: 'home_id', as: 'home' }); 
      // Una tarea puede tener muchas subtareas (relación de uno a muchos)
      Task.hasMany(models.Task, {
        foreignKey: 'parent_id',
        as: 'children',  // Alias para acceder a las subtareas
        onDelete: 'CASCADE',
        hooks: true,  // Asegura la eliminación en cascada de las subtareas
      });
      // Una subtarea pertenece a una tarea padre (relación de muchos a uno)
      Task.belongsTo(models.Task, {
        foreignKey: 'parent_id',
        as: 'parent',  // Alias para acceder a la tarea padre
      });

      // Relación many-to-many con Person
      Task.belongsToMany(models.Person, {
        through: models.HomePersonTask,
        foreignKey: 'task_id',
        otherKey: 'person_id',
        as: 'people',
      });
      Task.hasMany(models.HomePersonTask, { foreignKey: 'task_id', as: 'homePersonTasks' });
    }

    // Método para obtener la información de las personas
    getPeople() {
      return this.homePersonTasks.map(personTask => ({
        id: personTask.person_id,
        name: personTask.person.name,
        image: personTask.person.image,
        roleId: personTask.role_id,
        roleName: personTask.role ? personTask.role.name : null
      }));
    }
  }

  Task.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.STRING,  // Tipo TIME para almacenar la hora de inicio
      allowNull: true,       // El campo es opcional
    },
    end_time: {
      type: DataTypes.STRING,  // Tipo TIME para almacenar la hora de finalización
      allowNull: true,       // El campo es opcional
    },
    type: {
      type: DataTypes.STRING,  // Tipo STRING para almacenar el tipo de tarea
      allowNull: true,         // El campo es opcional
    },
    priority_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    home_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    recurrence: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estimated_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 0,
      },
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    geo_location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
  });
  return Task;
};
