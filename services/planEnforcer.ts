import { Plan } from "../models/plans";
import { Subscription } from "../models/subscription";

export class PlanLimitError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "PlanLimitError";
  }
}

export async function getSubscriptionWithPlan(userId: string) {
  return await Subscription.findOne({
    where: { userId, isActive: true },
    include: [{ model: Plan }],
  });
}

export function getPlan(subscription: InstanceType<typeof Subscription>) {
  return subscription.get("Plan") as InstanceType<typeof Plan>;
}

export function checkResumeUploadLimit(
  subscription: InstanceType<typeof Subscription>,
  plan: InstanceType<typeof Plan>,
) {
  const used = subscription.resumeUploadsThisMonth ?? 0;
  if (used >= plan.maxResumeUploads) {
    throw new PlanLimitError("UPLOAD_LIMIT_EXCEEDED");
  }
}

export function checkStorageLimit(
  subscription: InstanceType<typeof Subscription>,
  plan: InstanceType<typeof Plan>,
  fileSizeBytes: number,
) {
  const currentBytes = Number(subscription.currentStorageBytes ?? 0);
  const maxBytes = plan.maxStorageMb * 1024 * 1024;
  if (currentBytes + fileSizeBytes > maxBytes) {
    throw new PlanLimitError("STORAGE_LIMIT_EXCEEDED");
  }
}

export function checkApplicationLimit(
  subscription: InstanceType<typeof Subscription>,
  plan: InstanceType<typeof Plan>,
) {
  const used = subscription.applicationsThisMonth ?? 0;
  if (used >= plan.maxApplicationsPerMonth) {
    throw new PlanLimitError("APPLICATION_LIMIT_EXCEEDED");
  }
}

export function checkFeatureFlag(
  plan: InstanceType<typeof Plan>,
  feature: "allowJobImageUploads" | "allowAdvancedExports",
) {
  if (!plan[feature]) {
    throw new PlanLimitError("FEATURE_NOT_ALLOWED");
  }
}

export function getMaxActivityDays(plan: InstanceType<typeof Plan>): number {
  return plan.maxActivityDays;
}
