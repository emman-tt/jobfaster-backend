import { sequelize } from "./pool.js";
import { User } from "../models/user.js";
import { File } from "../models/file.js";
import { Folder } from "../models/folder.js";
import { Pointer } from "../models/pointer.js";
import dotenv from "dotenv";
import { Token } from "../models/token.js";
dotenv.config();

export async function db() {
  User.hasMany(Pointer, {
    onDelete: "CASCADE",
    foreignKey: "userId",
    as: "programs",
  });
  Pointer.belongsTo(User, {
    foreignKey: "userId",
    as: "programs",
  });

  Pointer.hasOne(File, {
    foreignKey: "id",
    sourceKey: "id",
    as: "file",
  });
  File.belongsTo(Pointer, {
    foreignKey: "id",
    targetKey: "id",
    as: "file",
  });

  User.hasMany(Token, {
    foreignKey: "userId",
    onDelete: "CASCADE",
  });
  Token.belongsTo(User, {
    foreignKey: "userId",
  });
  Pointer.hasOne(Folder, {
    foreignKey: "id",
    sourceKey: "id",
    as: "folder",
  });
  Folder.belongsTo(Pointer, {
    foreignKey: "id",
    targetKey: "id",
    as: "folder",
  });
  try {
    // sequelize.sync({alter:true});
  } catch (error) {
    console.log(error);
  }
}
