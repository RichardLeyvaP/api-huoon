'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('house_hold_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
       userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE', // ✅
        comment: 'ID del usuario que realiza la solicitud de unión'
      },
      targetUserId: {
        type: Sequelize.BIGINT,
        allowNull: true, // si es obligatorio
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL', // ✅ o 'SET NULL' si permites null
        comment: 'ID del usuario que recibe la solicitud'
      },
      userEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Correo electrónico del usuario que realiza la solicitud'
      },
      targetUserEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Correo electrónico del usuario que recibe la solicitud'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Tipo de solicitud (ej: "invite", "join_request", etc.)'
      },
      code: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Código único de validación para la solicitud'
      },
      resetCode: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Código adicional para restablecer o reenviar la solicitud (opcional)'
      },
      module: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nombre del módulo al que se dirige la solicitud (ej: "household", "team")'
      },
      moduleId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'ID del registro específico en el módulo (ej: ID del hogar)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('house_hold_requests');
  }
};