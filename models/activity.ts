import {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  Model,
} from "sequelize";
import { sequelize } from "../database/pool";

interface ActivityModel extends Model<
  InferAttributes<ActivityModel>,
  InferCreationAttributes<ActivityModel>
> {
  id: CreationOptional<string>;
  type: "FILE" | "JOB" | "FOLDER" | "MAIL";
  message: string;
  userId: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const Activity = sequelize.define<ActivityModel>("activity", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
