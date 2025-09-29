'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Initiative extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Initiative.belongsTo(models.Priority, {
      foreignKey: 'priority_id',
      as: 'priority',
      onDelete: 'SET NULL'
    });

    // Relación con Person
    Initiative.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
      onDelete: 'SET NULL'
    });

    // Auto-relación: una iniciativa puede tener padre (para derivar o personalizar)
    Initiative.belongsTo(Initiative, {
      foreignKey: 'parent_id',
      as: 'parent',
      onDelete: 'SET NULL'
    });

    // Y también puede tener muchas hijas
    Initiative.hasMany(Initiative, {
      foreignKey: 'parent_id',
      as: 'children'
    });
    }
  }
  Initiative.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    priority_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recurrence: {
      type: DataTypes.STRING,
      allowNull: true
    },
    person_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    task_type: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Initiative',
    tableName: 'initiatives',
    timestamps: true,
  });
  return Initiative;
};