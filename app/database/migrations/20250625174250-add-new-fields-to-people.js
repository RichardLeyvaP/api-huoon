'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.addColumn('people', 'medical_record_number', {
      type: Sequelize.STRING(100),
      unique: true,
      allowNull: true // Temporalmente permitimos null para datos existentes
    });

    await queryInterface.addColumn('people', 'document_type', {
      type: Sequelize.Sequelize.STRING(100), //ENUM('RUT', 'DNI', 'ID Card', 'Passport', 'Other'),
      allowNull: true
    });

    await queryInterface.addColumn('people', 'document_number', {
      type: Sequelize.STRING(100),
      unique: true,
      allowNull: true
    });

    await queryInterface.addColumn('people', 'health_coverage', {
      type: Sequelize.Sequelize.STRING(100), //ENUM('Fonasa', 'Isapre', 'Private', 'Private insurance', 'Other'),
      allowNull: true
    });

    await queryInterface.addColumn('people', 'coverage_name', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('people', 'blood_type', {
      type: Sequelize.STRING(10),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Revertimos todos los cambios
    await queryInterface.removeColumn('people', 'medical_record_number');
    
    await queryInterface.removeColumn('people', 'document_type');
    await queryInterface.removeColumn('people', 'document_number');
  
    await queryInterface.removeColumn('people', 'health_coverage');
    await queryInterface.removeColumn('people', 'coverage_name');

    await queryInterface.removeColumn('people', 'blood_type');
  }
};
