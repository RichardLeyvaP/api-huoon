'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pet_diets", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      pet_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "pets",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      food_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      brand: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      portion_size: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "types", // Tabla types
          key: "id",
        },
        onDelete: "SET NULL", // Evita borrar tipos usados
        onUpdate: "CASCADE",
      },
      special_instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "homes",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "people",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Índices
    await queryInterface.addIndex('pet_diets', ['pet_id']);
    await queryInterface.addIndex('pet_diets', ['food_type']);
    await queryInterface.addIndex('pet_diets', ['brand']);
    await queryInterface.addIndex('pet_diets', ['type_id']);
    await queryInterface.addIndex('pet_diets', ['home_id']);
    await queryInterface.addIndex('pet_diets', ['person_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pet_diets');
  }
};