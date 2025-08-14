'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CurrentMedication extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relación: medicamento pertenece a una mascota
      CurrentMedication.belongsTo(models.Pet, {
        foreignKey: 'pet_id',
        as: 'pet'
      });

      // Relación opcional con categoría/tipo de medicamento
      CurrentMedication.belongsTo(models.Type, {
        foreignKey: 'type_id',
        as: 'type'
      });

      // Relación opcional con hogar
      CurrentMedication.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home'
      });

      // Relación opcional con persona (responsable)
      CurrentMedication.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person'
      });
    }
  }
  CurrentMedication.init({
    pet_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Pet',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dosage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Type', // o 'Type' si usas otra tabla
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    route: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prescribed_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    home_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Home',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Person',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'CurrentMedication',
    tableName: 'current_medications',
    timestamps: true,
  });
  return CurrentMedication;
};