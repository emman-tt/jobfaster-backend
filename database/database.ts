import { sequelize } from "./pool.js";
import { User } from "../models/user.js";
import { File } from "../models/file.js";
import { Folder } from "../models/folder.js";
import { Pointer } from "../models/pointer.js";
import dotenv from "dotenv";
dotenv.config();

export async function db() {
  User.hasMany(Pointer, {
    onDelete: "CASCADE",
    foreignKey: "userId",
  });
  Pointer.belongsTo(User, {
    foreignKey: "userId",
  });

  Pointer.hasOne(File, {
    foreignKey: "id", // The File's 'id' is the link
    sourceKey: "id",
  });
  File.belongsTo(Pointer, {
    foreignKey: "id",
    targetKey: "id",
  });

  Pointer.hasOne(Folder, {
    foreignKey: "id",
    sourceKey: "id",
  });
  Folder.belongsTo(Pointer, {
    foreignKey: "id",
    targetKey: "id",
  });
  try {
    // sequelize.sync({alter:true});
  } catch (error) {
    console.log(error);
  }
}
