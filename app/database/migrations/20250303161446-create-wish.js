'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wishes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people',
          key: 'id'
        }
      },
      home_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'homes',
          key: 'id'
        }
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      end: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      priority_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'priorities',
          key: 'id'
        }
      },
      status_id: { // Nuevo campo
        type: Sequelize.BIGINT,
        references: {
          model: 'statuses',
          key: 'id'
        }
      },
      parent_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'wishes',
          key: 'id'
        }
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
    await queryInterface.dropTable('wishes');
  }
};