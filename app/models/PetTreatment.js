'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PetTreatment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relación: una vacuna pertenece a una mascota (obligatoria)
      PetTreatment.belongsTo(models.Pet, {
        foreignKey: 'pet_id',
        as: 'pet'
      });

      // Relación opcional con Home
      PetTreatment.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home'
      });

      // Relación opcional con Person (quien aplicó o registró la vacuna)
      PetTreatment.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person'
      });
    }
  }
  PetTreatment.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      next_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dosage: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: "ml",
      },
      pet_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "Pet",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      home_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "Home",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      person_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "Person",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      sequelize,
      modelName: "PetTreatment",
      tableName: "pet_treatments",
      timestamps: true,
    }
  );
  return PetTreatment;
};