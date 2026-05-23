import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const { POSTGRES_CONNECTION } = process.env;

const pool = new Pool({
  connectionString: POSTGRES_CONNECTION,
});

async function addPlanFeatures() {
  const client = await pool.connect();
  try {
    console.log("Adding plan feature columns...");

    await client.query(`
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS allow_job_image_uploads BOOLEAN DEFAULT false;
    `);
    console.log("✓ Added allow_job_image_uploads");

    await client.query(`
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS allow_advanced_exports BOOLEAN DEFAULT false;
    `);
    console.log("✓ Added allow_advanced_exports");

    await client.query(`
      UPDATE plans SET allow_job_image_uploads = false, allow_advanced_exports = false WHERE name = 'free';
    `);
    console.log("✓ Updated Free plan (text-only, PDF-only)");

    await client.query(`
      UPDATE plans SET allow_job_image_uploads = true, allow_advanced_exports = true WHERE name = 'pro';
    `);
    console.log("✓ Updated Pro plan (images + advanced exports)");

    await client.query(`
      UPDATE plans SET allow_job_image_uploads = true, allow_advanced_exports = true WHERE name = 'premium';
    `);
    console.log("✓ Updated Premium plan (images + advanced exports)");

    const result = await client.query(`
      SELECT name, display_name, variant_id, price_monthly, allow_job_image_uploads, allow_advanced_exports
      FROM plans 
      ORDER BY sort_order ASC;
    `);

    console.log("\nCurrent plans:");
    result.rows.forEach((row) => {
      console.log(
        `  ${row.display_name}: images=${row.allow_job_image_uploads}, advanced_exports=${row.allow_advanced_exports}`,
      );
    });

    console.log("\n✓ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

addPlanFeatures();
