import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
/** @type {import('sequelize').ModelStatic<import('sequelize').Model>} */

interface UserModel extends Model<
  InferAttributes<UserModel>,
  InferCreationAttributes<UserModel>
> {
  id: CreationOptional<string>;
  name: string;
  password: string;
  email: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}
export const User = sequelize.define<UserModel>("user", {
  id: {
    type: DataTypes.UUID,
    defaultValue:DataTypes.UUIDV4,
    allowNull:false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
