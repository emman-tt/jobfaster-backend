import dotenv from "dotenv";
dotenv.config()
import { Sequelize } from "sequelize";
import * as neon from "@neondatabase/serverless";
const { POSTGRES_CONNECTION } = process.env;
console.log(POSTGRES_CONNECTION,'working')
export const sequelize = new Sequelize(POSTGRES_CONNECTION, {
  dialect: "postgres",
  dialectModule: neon,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
