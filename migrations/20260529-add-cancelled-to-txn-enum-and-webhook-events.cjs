'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('transactions')) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_transactions_status" ADD VALUE 'cancelled'`,
        );
      } catch (e) {
        console.log('Enum value may already exist:', e.message);
      }
    }

    if (!tables.includes('processed_webhook_events')) {
      await queryInterface.createTable('processed_webhook_events', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        idempotency_key: {
          type: Sequelize.STRING(64),
          allowNull: false,
          unique: true,
          field: 'idempotency_key',
        },
        event_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          field: 'event_name',
        },
        processed_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          field: 'processed_at',
        },
      });

      await queryInterface.addIndex('processed_webhook_events', ['idempotency_key'], {
        unique: true,
      });

      await queryInterface.addIndex('processed_webhook_events', ['processed_at']);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('processed_webhook_events');
  },
};
