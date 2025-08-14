'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relación: Pet pertenece a una categoría (especie)
      Pet.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category' // Accederás como pet.species.name
      });

      // Relación opcional con Home
      Pet.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home'
      });

      // Relación opcional con Person (dueño personal)
      Pet.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person'
      });
      Pet.hasMany(models.PetTreatment, {
          foreignKey: 'pet_id',
          as: 'pettreatments',
        });
      Pet.hasMany(models.VetVisit, {
          foreignKey: 'pet_id',
          as: 'vetvisits',
        });
    Pet.hasMany(models.CurrentMedication, {
          foreignKey: 'pet_id',
          as: 'currentmedications',
        });
    Pet.hasMany(models.PetDiet, {
          foreignKey: 'pet_id',
          as: 'petdiets',
        });
      // Ejemplo futuro: historial médico
      // Pet.hasMany(models.MedicalRecord, {
      //   foreignKey: 'pet_id',
      //   as: 'medicalRecords',
      //   onDelete: 'CASCADE'
      // });
    }
  }

  Pet.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Category', // Nombre del modelo (no de tabla)
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    breed: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    microchip: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    signs: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    home_id: {
      type: DataTypes.BIGINT,
      references: {
        model: 'Home',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      allowNull: true,
    },
    person_id: {
      type: DataTypes.BIGINT,
      references: {
        model: 'Person',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Pet',
    tableName: 'pets',
    timestamps: true,
  });

  return Pet;
};