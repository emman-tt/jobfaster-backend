require("dotenv").config();

const connectionString = process.env.POSTGRES_MIGRATION_CONNECTION;

module.exports = {
  development: {
    url: connectionString,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  test: {
    url: connectionString,
    dialect: "postgres",
    logging: false,
  },
  production: {
    url: connectionString,
    dialect: "postgres",
    logging: false,
  },
};