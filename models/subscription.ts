import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

interface SubscriptionModel extends Model<
  InferAttributes<SubscriptionModel>,
  InferCreationAttributes<SubscriptionModel>
> {
  id: CreationOptional<string>;
  userId: string;
  planId: string;
  startDate: CreationOptional<Date>;
  endDate: Date | null;
  renewsAt: Date | null;
  trialEndsAt: Date | null;
  isActive: CreationOptional<boolean>;
  status: string | null;
  billingCycle: "monthly" | "yearly" | null;
  amountPaid: number | null;
  currency: CreationOptional<string>;
  lemonSqueezyId: string | null;
  lemonSqueezyOrderId: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  updatePaymentMethodUrl: string | null;
  resumeUploadsThisMonth: CreationOptional<number>;
  applicationsThisMonth: CreationOptional<number>;
  lastResetDate: CreationOptional<Date>;
  currentStorageBytes: CreationOptional<number>;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Subscription = sequelize.define<SubscriptionModel>(
  "Subscription",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "plan_id",
      references: {
        model: "plans",
        key: "id",
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "start_date",
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "end_date",
    },
    renewsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "renews_at",
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "trial_ends_at",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    billingCycle: {
      type: DataTypes.ENUM("monthly", "yearly"),
      allowNull: true,
      field: "billing_cycle",
    },
    amountPaid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "amount_paid",
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
    },
    lemonSqueezyId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "lemon_squeezy_id",
    },
    lemonSqueezyOrderId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "lemon_squeezy_order_id",
    },
    cardBrand: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "card_brand",
    },
    cardLastFour: {
      type: DataTypes.STRING(4),
      allowNull: true,
      field: "card_last_four",
    },
    updatePaymentMethodUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "update_payment_method_url",
    },
    resumeUploadsThisMonth: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "resume_uploads_this_month",
    },
    applicationsThisMonth: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "applications_this_month",
    },
    lastResetDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "last_reset_date",
    },
    currentStorageBytes: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      field: "current_storage_bytes",
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "cancelled_at",
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "cancel_reason",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    tableName: "user_subscriptions",
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["plan_id"],
      },
      {
        fields: ["is_active"],
      },
      {
        unique: true,
        fields: ["lemon_squeezy_id"],
      },
    ],
  },
);
