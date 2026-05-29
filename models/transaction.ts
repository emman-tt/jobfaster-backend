import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

interface TransactionModel extends Model<
  InferAttributes<TransactionModel>,
  InferCreationAttributes<TransactionModel>
> {
  id: CreationOptional<string>;
  userId: string;
  subscriptionId: string | null;
  provider: CreationOptional<string>;
  providerTransactionId: string | null;
  providerOrderId: string | null;
  amount: number;
  currency: CreationOptional<string>;
  description: string | null;
  status: CreationOptional<"pending" | "paid" | "failed" | "refunded" | "disputed" | "cancelled">;
  paidAt: Date | null;
  failedAt: Date | null;
  refundedAt: Date | null;
  metadata: CreationOptional<object>;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Transaction = sequelize.define<TransactionModel>(
  "Transaction",
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
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "subscription_id",
      references: {
        model: "user_subscriptions",
        key: "id",
      },
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "lemon_squeezy",
    },
    providerTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "provider_transaction_id",
    },
    providerOrderId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "provider_order_id",
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
    },
    description: {
      type: DataTypes.STRING(255),
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded", "disputed"),
      defaultValue: "pending",
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "failed_at",
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "refunded_at",
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    tableName: "transactions",
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["subscription_id"],
      },
      {
        unique: true,
        fields: ["provider_transaction_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["created_at"],
      },
    ],
  },
);
