'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nutrition_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        unique: true
      },
      calories: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Meta diaria de calorías (ej: 2000)'
      },
      protein: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Meta diaria de proteína en gramos (ej: 80)'
      },
      carbs: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Meta diaria de carbohidratos en gramos'
      },
      fats: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Meta diaria de grasas totales en gramos'
      },
      fiber: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Meta diaria de fibra en gramos (ej: 30)'
      },
      sugar_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Límite diario de azúcar en gramos (ej: 25)'
      },
      sat_fats_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Límite diario de grasas saturadas en gramos (ej: 20)'
      },
      water: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: 'Meta diaria de agua en litros (ej: 2.0)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('nutrition_profiles');
  }
};