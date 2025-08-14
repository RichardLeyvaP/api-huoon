'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VetVisit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relación: una visita pertenece a una mascota
      VetVisit.belongsTo(models.Pet, {
        foreignKey: 'pet_id',
        as: 'pet'
      });

      // Relación opcional con Home
      VetVisit.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home'
      });

      // Relación opcional con Person (quien registró o llevó a la mascota)
      VetVisit.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person'
      });
    }
  }
  VetVisit.init({
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    vet_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clinic: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    treatment_given: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    next_visit: {
      type: DataTypes.DATEONLY,
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
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'VetVisit',
    tableName: 'vet_visits',
    timestamps: true,
  });
  return VetVisit;
};