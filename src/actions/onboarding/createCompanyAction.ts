"use server";

import { db } from '@/db';
import { getUserFromKinde } from '@/lib/getUserFromKinde';
import { vercelBlobUpload } from "@/lib/vercelBlobUpload";
import { revalidatePath } from "next/cache";

export async function createCompanyAction(formData: FormData) {
  const userKinde = await getUserFromKinde();
  if (!userKinde) {
    throw new Error("User not found");
  }

  const name = formData.get("tenant.name") as string;
  const about = (formData.get("tenant.about") as string | null) ?? "";
  const website = (formData.get("tenant.website") as string | null) ?? "";
  let url = null;
  const logoUrl = (formData.get("tenant.logoUrl") as string | null) ?? "";
  const logoFile = formData.get("tenant.logoFile") as File | null;

  const phoneNumber = formData.get("phoneNumber") as string | null;

  if (logoFile) {
    url = await vercelBlobUpload(logoFile);
  }

  const user = await db.user.findUnique({
    where: {
      id: userKinde.id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  user.phoneNumber = phoneNumber;
  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      phoneNumber,
    },
  });

  const tenant = await db.tenant.create({
    data: {
      name,
      about,
      logoUrl: url ?? logoUrl,
      website,
      onboardingStep: "users",
      onboardedAt: new Date(),
    },
  });

  await db.membership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      role: "OWNER",
    },
  });

  revalidatePath("/onboarding/users");
  return { success: true, redirectUrl: "/onboarding/users" };
}
