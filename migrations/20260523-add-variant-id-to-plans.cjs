'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('plans');
    
    if (!tableInfo.variant_id) {
      await queryInterface.addColumn('plans', 'variant_id', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });

      await queryInterface.bulkUpdate('plans', { variant_id: 'free' }, { name: 'free' });
      await queryInterface.bulkUpdate('plans', { variant_id: 'monthly_pro' }, { name: 'pro' });
      await queryInterface.bulkUpdate('plans', { variant_id: 'monthly_premium' }, { name: 'premium' });

      await queryInterface.changeColumn('plans', 'variant_id', {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('plans', 'variant_id');
  },
};
