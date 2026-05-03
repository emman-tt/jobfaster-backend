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
  source: "upload" | "builder";
  folderId: string | null;
  parsedContent: Record<string, any> | null;
  metaData: {
    name: string;
    extension: "pdf" | "docx";
    layoutId: string | null;
    size: number;
    content: string;
    downloadUrl: string;
  };
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
  folderId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  parsedContent: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  metaData: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  source: {
    type: DataTypes.ENUM("upload", "builder"),
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
