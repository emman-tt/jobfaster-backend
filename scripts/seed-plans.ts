import dotenv from "dotenv";
dotenv.config();

import "../database/pool";
import { Plan } from "../models/plans";

const plans = [
  {
    name: "free",
    displayName: "Free",
    variantId: "free",
    priceMonthly: 0,
    priceYearly: 0,
    maxResumeUploads: 1,
    maxApplicationsPerMonth: 50,
    maxActivityDays: 30,
    maxStorageMb: 50,
    allowJobImageUploads: false,
    allowAdvancedExports: false,
    sortOrder: 1,
    currency: "USD",
    isActive: true,
  },
  {
    name: "pro",
    displayName: "Pro",
    variantId: "monthly_pro",
    priceMonthly: 4,
    priceYearly: 40,
    maxResumeUploads: 10,
    maxApplicationsPerMonth: 500,
    maxActivityDays: 90,
    maxStorageMb: 500,
    allowJobImageUploads: true,
    allowAdvancedExports: true,
    sortOrder: 2,
    currency: "USD",
    isActive: true,
  },
  {
    name: "premium",
    displayName: "Premium",
    variantId: "monthly_premium",
    priceMonthly: 9,
    priceYearly: 90,
    maxResumeUploads: 100,
    maxApplicationsPerMonth: 1000,
    maxActivityDays: 365,
    maxStorageMb: 10000,
    allowJobImageUploads: true,
    allowAdvancedExports: true,
    sortOrder: 3,
    currency: "USD",
    isActive: true,
  },
];

async function seedPlans() {
  try {
    console.log("Seeding plans...");

    for (const planData of plans) {
      const [plan, created] = await Plan.upsert(planData, {
        returning: true,
        conflictFields: ["name"],
      });

      if (created) {
        console.log(`✓ Created plan: ${planData.displayName}`);
      } else {
        console.log(`✓ Updated plan: ${planData.displayName}`);
      }
    }

    console.log("\nAll plans seeded successfully!");

    const allPlans = await Plan.findAll({
      order: [["sortOrder", "ASC"]],
    });

    console.log("\nCurrent plans in database:");
    allPlans.forEach((p) => {
      const data = p.toJSON();
      console.log(
        `  [${data.sortOrder}] ${data.displayName}: $${data.priceMonthly}/mo or $${data.priceYearly}/yr`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed plans:", error);
    process.exit(1);
  }
}

seedPlans();
