import {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  Model,
} from "sequelize";
import { sequelize } from "../database/pool";

interface TokenModel extends Model<
  InferAttributes<TokenModel>,
  InferCreationAttributes<TokenModel>
> {
  id: CreationOptional<string>;
  userId: string;
  deviceName: string;
  devicePrint: string;
  token: string;
  expiresAt: Date;
  lastUsed: Date;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Token = sequelize.define<TokenModel>("token", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  devicePrint: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
