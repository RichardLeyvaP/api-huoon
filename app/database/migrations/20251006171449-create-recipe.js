'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recipes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'PK – Identificador único de la receta'
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        comment: 'FK → people.id – Persona creadora de la receta'
      },
      home_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'homes',
          key: 'id'
        },
        onDelete: 'SET NULL',
        allowNull: true,
        comment: 'FK → homes.id – Hogar al que pertenece (opcional)'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Nombre de la receta (ej: "Ensalada César")'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Instrucciones o detalles de preparación'
      },
      is_favorite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indica si la receta está marcada como favorita'
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'URL de la foto de la receta'
      },
      preparation_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Tiempo de preparación en minutos'
      },
      servings: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Número de porciones que rinde la receta completa'
      },
      calories: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Calorías totales de la receta completa'
      },
      protein: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Proteína total en gramos'
      },
      carbs: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Carbohidratos totales en gramos'
      },
      fats: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Grasas totales en gramos'
      },
      fiber: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Fibra total en gramos'
      },
      sugar: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Azúcar total en gramos'
      },
      saturated_fats: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Grasas saturadas totales en gramos'
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'false = pública (compartida), true = privada (solo del creador)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: 'Fecha de creación del registro'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: 'Última actualización del registro'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('recipes');
  }
};