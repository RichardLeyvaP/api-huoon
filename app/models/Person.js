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
        as: 'homePersons',  // Alias para la relación
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
        Person.hasMany(models.Wish, { foreignKey: 'person_id', as: 'wishes', onDelete: 'CASCADE' });
        Person.hasMany(models.Finance, { foreignKey: 'person_id', as: 'finances', onDelete: 'CASCADE' });
        Person.hasMany(models.Home, { foreignKey: 'person_id', as: 'homes', onDelete: 'CASCADE' });
        Person.hasMany(models.File, { foreignKey: 'person_id', as: 'files', onDelete: 'CASCADE' });
        Person.hasMany(models.MedicalHistory, { foreignKey: 'person_id', as: 'medicalhistories', onDelete: 'CASCADE' });
        Person.hasMany(models.MedicalConsultation, { foreignKey: 'person_id', as: 'medicalconsultations', onDelete: 'CASCADE' });
        Person.hasMany(models.MedicalExam, { foreignKey: 'person_id', as: 'medicalexams', onDelete: 'CASCADE' });
        Person.hasMany(models.Emergency, { foreignKey: 'person_id', as: 'emergencies', onDelete: 'CASCADE' });
        Person.hasMany(models.PersonalBackground, {
        foreignKey: 'person_id',
        as: 'personalBackgrounds', // Cambiado de 'emergencies' a 'backgrounds' para mayor claridad
        onDelete: 'CASCADE' // Elimina los antecedentes si se elimina la persona
        });
        Person.hasMany(models.FamilyBackground, {
        foreignKey: 'person_id',
        as: 'familyBackgrounds'
        });
        Person.hasMany(models.PhysicalExam, {
        foreignKey: 'person_id',
        as: 'physicalExams'
        });
        Person.hasMany(models.PsychosocialBackground, {
        foreignKey: 'person_id',
        as: 'psychosocialBackgrounds'
        });
        Person.hasMany(models.Diagnosis, {
        foreignKey: 'person_id',
        as: 'diagnoses'
        });
        Person.hasMany(models.Budget, {
          foreignKey: 'person_id',
          as: 'budgets',
        });
        Person.hasMany(models.Pet, {
          foreignKey: 'person_id',
          as: 'pets',
        });
        Person.hasMany(models.PetTreatment, {
          foreignKey: 'person_id',
          as: 'pettreatments',
        });
      Person.hasMany(models.VetVisit, {
            foreignKey: 'person_id',
            as: 'vetvisits',
          });
      Person.hasMany(models.CurrentMedication, {
            foreignKey: 'person_id',
            as: 'currentmedications',
          });
      Person.hasMany(models.PetDiet, {
            foreignKey: 'person_id',
            as: 'petdiets',
          });
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Nuevos campos añadidos según la migración
  medical_record_number: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  document_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  document_number: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  health_coverage: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  coverage_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
   blood_type: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      is: /^(A|B|AB|O)[+-]$/i // Validación básica para grupos sanguíneos
    }
  }
  }, {
    sequelize,
    modelName: 'Person',
    tableName: 'people', // Asegúrate de que el nombre de la tabla sea correcto
    timestamps: true, // Si deseas incluir createdAt y updatedAt
    indexes: [
    {
      unique: true,
      fields: ['medical_record_number']
    },
    {
      unique: true,
      fields: ['document_number']
    }
  ]
  });
  return Person;
};