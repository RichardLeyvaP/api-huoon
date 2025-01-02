'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AiInteraction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AiInteraction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
    }
  }
  AiInteraction.init({
    module: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    question: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    user_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AiInteraction',
    tableName: 'ai_interactions',
    timestamps: true
  });
  return AiInteraction;
};