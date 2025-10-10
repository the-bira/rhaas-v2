"use server";

import { db } from "@/db";
import { Role } from "@/generated/prisma";
import { getUserFromKinde } from "@/lib/getUserFromKinde";
import { headers } from "next/headers";

type InviteUser = { email: string; role: string };
type InviteField = keyof InviteUser; // "email" | "role"

export async function inviteUsersAction(formData: FormData) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Tenant not found");
  }

  const userKinde = await getUserFromKinde();
  if (!userKinde) {
    throw new Error("User not found");
  }

  const users: InviteUser[] = [];

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^users\[(\d+)\]\.(email|role)$/);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2] as InviteField;
      users[index] = users[index] || { email: "", role: "" };
      users[index][field] = value as string;
    }
  }

  await db.$transaction(async (tx) => {
    for (const user of users) {
      if (user.email && user.role) {
        try {
          await tx.invite.create({
            data: {
              email: user.email,
              role: user.role as Role,
              tenantId,
            },
          });
        } catch (error) {
          console.error(error);
        }
      }
    }

    // ✅ Marcar onboarding como completo
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        onboardingStep: "done",
      },
    });
  });

  return { success: true, redirectUrl: "/dashboard" };
}
