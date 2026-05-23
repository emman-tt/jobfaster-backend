'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('plans')) {
      await queryInterface.createTable('plans', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        display_name: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        price_monthly: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        price_yearly: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'USD',
        },
        max_resume_uploads: {
          type: Sequelize.INTEGER,
        },
        max_applications_per_week: {
          type: Sequelize.INTEGER,
          defaultValue: 50,
        },
        max_activity_days: {
          type: Sequelize.INTEGER,
          defaultValue: 30,
        },
        max_storage_mb: {
          type: Sequelize.INTEGER,
        },
        sort_order: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
        },
        updated_at: {
          type: Sequelize.DATE,
        },
      });
    }

    if (!tables.includes('user_subscriptions')) {
      await queryInterface.createTable('user_subscriptions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        plan_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'plans',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        start_date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        end_date: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        billing_cycle: {
          type: Sequelize.ENUM('monthly', 'yearly'),
          allowNull: true,
        },
        amount_paid: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'USD',
        },
        lemon_squeezy_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        lemon_squeezy_order_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        resume_uploads_this_month: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        applications_this_month: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        last_reset_date: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        current_storage_bytes: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        },
        cancelled_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        cancel_reason: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
        },
        updated_at: {
          type: Sequelize.DATE,
        },
      });

      await queryInterface.addIndex('user_subscriptions', ['user_id']);
      await queryInterface.addIndex('user_subscriptions', ['plan_id']);
      await queryInterface.addIndex('user_subscriptions', ['is_active']);
      await queryInterface.addIndex('user_subscriptions', ['lemon_squeezy_id'], {
        unique: true,
        where: {
          lemon_squeezy_id: { [Sequelize.Op.ne]: null },
        },
      });
    }

    if (!tables.includes('transactions')) {
      await queryInterface.createTable('transactions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        subscription_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'user_subscriptions',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        provider: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'lemon_squeezy',
        },
        provider_transaction_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        provider_order_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        amount: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'USD',
        },
        description: {
          type: Sequelize.STRING(255),
        },
        status: {
          type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded', 'disputed'),
          defaultValue: 'pending',
        },
        paid_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        failed_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        refunded_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
        },
        created_at: {
          type: Sequelize.DATE,
        },
        updated_at: {
          type: Sequelize.DATE,
        },
      });

      await queryInterface.addIndex('transactions', ['user_id']);
      await queryInterface.addIndex('transactions', ['subscription_id']);
      await queryInterface.addIndex('transactions', ['provider_transaction_id'], {
        unique: true,
        where: {
          provider_transaction_id: { [Sequelize.Op.ne]: null },
        },
      });
      await queryInterface.addIndex('transactions', ['status']);
      await queryInterface.addIndex('transactions', ['created_at']);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('user_subscriptions');
    await queryInterface.dropTable('plans');
  },
};
