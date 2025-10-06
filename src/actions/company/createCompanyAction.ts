"use server";

import { db } from "@/db";

export async function createCompanyAction(userId: string, name: string) {
  const tenant = await db.tenant.create({
    data: {
      name,
      onboardingStep: "jobs",
    },
  });

  await db.membership.create({
    data: {
      userId,
      tenantId: tenant.id,
      role: "OWNER",
    },
  });

  return tenant;
}

