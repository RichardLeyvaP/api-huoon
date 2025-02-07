'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Status extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Status.hasMany(models.Task, {
        foreignKey: 'status_id',
        as: 'tasks',
        onDelete: 'CASCADE'
    });
    }
  }
  Status.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Status',
    tableName: 'statuses', // Asegúrate de que el nombre de la tabla sea correcto
    timestamps: true, // Si deseas incluir createdAt y updatedAt
  });
  return Status;
};