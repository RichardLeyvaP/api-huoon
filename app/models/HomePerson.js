'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HomePerson extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      HomePerson.belongsTo(models.Home, { foreignKey: 'home_id', as: 'home' });
      HomePerson.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' });
      HomePerson.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    }
  }
  HomePerson.init({
    home_id: DataTypes.BIGINT,
    person_id: DataTypes.BIGINT,
    role_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'HomePerson',
    tableName: 'home_person',
    timestamps: true,
  });
  return HomePerson;
};