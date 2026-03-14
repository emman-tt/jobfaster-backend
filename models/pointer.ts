import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

interface PointerModel extends Model<
  InferAttributes<PointerModel>,
  InferCreationAttributes<PointerModel>
> {
  id: CreationOptional<string>;
  userId: string;
  //   targetId: string;
  type: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Pointer = sequelize.define<PointerModel>("pointer", {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  //   targetId: {
  //     type: DataTypes.UUID,
  //     allowNull: false,
  //   },
  type: {
    type: DataTypes.ENUM("FILE", "FOLDER"),
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
