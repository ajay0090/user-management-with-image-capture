'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: JSON.stringify(['all']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Supervisor',
        description: 'Supervisor with limited access',
        permissions: JSON.stringify(['view_images', 'view_users']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Worker',
        description: 'Worker with basic access',
        permissions: JSON.stringify(['capture_images', 'view_own_images']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
