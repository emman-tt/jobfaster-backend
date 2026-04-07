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
  metaData: {
    size: number;
    name: string;
  };
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
  metaData: {
    type: DataTypes.JSONB,
    allowNull:false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
