"use server";

import { db } from '@/db';
import { getUserFromKinde } from '@/lib/getUserFromKinde';

export async function createCompanyAction(userId: string, formData: FormData) {

  const name = formData.get("tenant.name") as string;
  const about = (formData.get("tenant.about") as string | null) ?? "";
  const website = (formData.get("tenant.website") as string | null) ?? "";
  const logoUrl = (formData.get("tenant.logoUrl") as string | null) ?? "";
  const logoFile = formData.get("tenant.logoFile") as File | null;

  const phoneNumber = formData.get("phoneNumber") as string | null;



  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });
  
  if (!user) {
    throw new Error("User not found");
  }

  user.phoneNumber = phoneNumber;
  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      phoneNumber,
    },
  });

  const tenant = await db.tenant.create({
    data: {
      name,
      about,
      logoUrl,
      website,
      onboardingStep: "users",
      onboardedAt: new Date(),
    },
  });


}
