import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
/** @type {import('sequelize').ModelStatic<import('sequelize').Model>} */

interface SettingsModel extends Model<
  InferAttributes<SettingsModel>,
  InferCreationAttributes<SettingsModel>
> {
  id: CreationOptional<string>;
  userId: string;
  aiTailoringComplete: boolean;
  jobEmailSendAlert: boolean;
  newJobsAlert: boolean;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Settings = sequelize.define<SettingsModel>("settings", {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  newJobsAlert: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  aiTailoringComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  jobEmailSendAlert: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
