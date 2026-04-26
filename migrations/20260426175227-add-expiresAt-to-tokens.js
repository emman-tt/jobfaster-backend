import { DataTypes } from "sequelize";

export async function up(queryInterface: any) {
  await queryInterface.addColumn("tokens", "expiresAt", {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

export async function down(queryInterface: any) {
  await queryInterface.removeColumn("tokens", "expiresAt");
}