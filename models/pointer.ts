import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { File } from "../models/file";
import { Folder } from "../models/folder";
interface PointerModel extends Model<
  InferAttributes<PointerModel>,
  InferCreationAttributes<PointerModel>
> {
  id: CreationOptional<string>;
  userId: string;
  type: "FILE" | "FOLDER";
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
  file?: InstanceType<typeof File>;
  folder?: InstanceType<typeof Folder>;
}

export const Pointer = sequelize.define<PointerModel>("pointer", {
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
  type: {
    type: DataTypes.ENUM("FILE", "FOLDER"),
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
