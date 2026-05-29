import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

interface ProcessedEventModel extends Model<
  InferAttributes<ProcessedEventModel>,
  InferCreationAttributes<ProcessedEventModel>
> {
  id: CreationOptional<string>;
  idempotencyKey: string;
  eventName: string;
  processedAt: CreationOptional<Date>;
}

export const ProcessedEvent = sequelize.define<ProcessedEventModel>(
  "ProcessedEvent",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    idempotencyKey: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: "idempotency_key",
    },
    eventName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "event_name",
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "processed_at",
    },
  },
  {
    tableName: "processed_webhook_events",
    underscored: true,
    timestamps: false,
  },
);
