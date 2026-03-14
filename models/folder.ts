import {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  Model,
} from "sequelize";
import { sequelize } from "../database/pool";

interface FolderModel extends Model<
  InferAttributes<FolderModel>,
  InferCreationAttributes<FolderModel>
> {
  id: CreationOptional<string>;
  size: number;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Folder = sequelize.define<FolderModel>("folder", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  size: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
