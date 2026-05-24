'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('user_subscriptions')) {
      try {
        await queryInterface.removeIndex('user_subscriptions', ['lemon_squeezy_id']);
      } catch (e) {
        console.log('Index may not exist, adding new one...');
      }
      await queryInterface.addIndex('user_subscriptions', ['lemon_squeezy_id'], {
        unique: true,
      });
    }

    if (tables.includes('transactions')) {
      try {
        await queryInterface.removeIndex('transactions', ['provider_transaction_id']);
      } catch (e) {
        console.log('Index may not exist, adding new one...');
      }
      await queryInterface.addIndex('transactions', ['provider_transaction_id'], {
        unique: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('user_subscriptions', ['lemon_squeezy_id']);
    await queryInterface.removeIndex('transactions', ['provider_transaction_id']);
    
    await queryInterface.addIndex('user_subscriptions', ['lemon_squeezy_id'], {
      unique: true,
      where: {
        lemon_squeezy_id: { [Sequelize.Op.ne]: null },
      },
    });
    
    await queryInterface.addIndex('transactions', ['provider_transaction_id'], {
      unique: true,
      where: {
        provider_transaction_id: { [Sequelize.Op.ne]: null },
      },
    });
  },
};
