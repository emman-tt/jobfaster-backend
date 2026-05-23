import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

interface PlanModel extends Model<
  InferAttributes<PlanModel>,
  InferCreationAttributes<PlanModel>
> {
  id: CreationOptional<string>;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  maxResumeUploads: number;
  maxApplicationsPerMonth: 50 | 500 | 1000;
  maxActivityDays: 30 | 90 | 365;
  maxStorageMb: 50 | 500 | 10000;
  sortOrder: 1 | 2 | 3;
  currency: string;
  isActive: boolean;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Plan = sequelize.define<PlanModel>(
  "Plan",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    priceMonthly: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "price_monthly",
    },
    priceYearly: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "price_yearly",
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
    },
    maxResumeUploads: {
      type: DataTypes.INTEGER,
      field: "max_resume_uploads",
    },
    maxApplicationsPerMonth: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      field: "max_applications_per_week",
    },
    maxActivityDays: {
      type: DataTypes.INTEGER,
      field: "max_activity_days",
      defaultValue: 30,
    },
    maxStorageMb: {
      type: DataTypes.INTEGER,
      field: "max_storage_mb",
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    underscored: true,
  },
);
