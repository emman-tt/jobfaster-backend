import {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  Model,
} from "sequelize";
import { sequelize } from "../database/pool";

interface FileModel extends Model<
  InferAttributes<FileModel>,
  InferCreationAttributes<FileModel>
> {
  id: CreationOptional<string>;
  size: number;
  folderId: string | null;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const File = sequelize.define<FileModel>("file", {
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
  folderId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
