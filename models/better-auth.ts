import { DataTypes } from "sequelize";
import { sequelize } from "../database/pool.js";
import type { Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

export interface AccountModel extends Model<InferAttributes<AccountModel>, InferCreationAttributes<AccountModel>> {
  id: CreationOptional<string>;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  idToken?: string;
  scope?: string;
  password?: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export interface VerificationModel extends Model<InferAttributes<VerificationModel>, InferCreationAttributes<VerificationModel>> {
  id: CreationOptional<string>;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Account = sequelize.define<AccountModel>("ba_account", {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => crypto.randomUUID(),
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accessToken: DataTypes.TEXT,
  refreshToken: DataTypes.TEXT,
  expiresAt: DataTypes.DATE,
  idToken: DataTypes.TEXT,
  scope: DataTypes.TEXT,
  password: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

export const Verification = sequelize.define<VerificationModel>("ba_verification", {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => crypto.randomUUID(),
    primaryKey: true,
  },
  identifier: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});