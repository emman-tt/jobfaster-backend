import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const { POSTGRES_CONNECTION } = process.env;

const pool = new Pool({
  connectionString: POSTGRES_CONNECTION,
});

async function addSubscriptionColumns() {
  const client = await pool.connect();
  try {
    console.log("Adding missing subscription columns...");

    const columnsToAdd = [
      { name: "renews_at", type: "TIMESTAMP" },
      { name: "trial_ends_at", type: "TIMESTAMP" },
      { name: "status", type: "VARCHAR(50)" },
      { name: "card_brand", type: "VARCHAR(50)" },
      { name: "card_last_four", type: "VARCHAR(4)" },
      { name: "update_payment_method_url", type: "TEXT" },
    ];

    const tableInfo = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions'
    `);
    const existingColumns = tableInfo.rows.map((r) => r.column_name);

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        await client.query(`
          ALTER TABLE user_subscriptions ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`✓ Added ${col.name}`);
      } else {
        console.log(`✓ Column ${col.name} already exists`);
      }
    }

    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

addSubscriptionColumns();
