const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Image = require('./Image');

// Associations
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

User.hasMany(Image, { foreignKey: 'userId' });
Image.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Role,
  Image,
};
