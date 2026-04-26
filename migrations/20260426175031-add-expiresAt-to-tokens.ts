import { DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: any) {
    await queryInterface.addColumn("tokens", "expiresAt", {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  },

  async down(queryInterface: any) {
    await queryInterface.removeColumn("tokens", "expiresAt");
  },
};