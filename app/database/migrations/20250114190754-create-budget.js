'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("budgets", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "people",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "homes",
          key: "id",
        },
      },
      category_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
      },
      amount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      used_amount: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      budget_type: {
        type: Sequelize.STRING, //('personal', 'house')
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING, //('active', 'inactive', 'completed', 'exceeded')
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: true,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('budgets');
  }
};