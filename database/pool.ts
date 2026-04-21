import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const { POSTGRES_CONNECTION } = process.env;

export const sequelize = new Sequelize(POSTGRES_CONNECTION);
